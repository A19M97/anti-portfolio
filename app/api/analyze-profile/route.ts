import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  saveUploadedFile,
  readFileForClaude,
  deleteUploadedFiles,
} from "@/lib/file-processing";
import { analyzeProfileWithClaude } from "@/lib/anthropic";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES,
} from "@/lib/validations/profile-analysis";
import { loggers } from "@/lib/logger";
import { getDefaultClaudeModel } from "@/lib/settings";

const logger = loggers.api;

export async function POST(req: Request) {
  const logComplete = logger.startOperation("POST /api/analyze-profile");

  try {
    logger.info("Received profile analysis request");

    // Check authentication
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      logger.warn("Unauthorized request - no clerkId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.debug("User authenticated", { clerkId });

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      logger.error("User not found in database", undefined, { clerkId });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    logger.info("User found", { userId: user.id, email: user.email });

    // Parse form data
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    const freeText = formData.get("freeText") as string | null;
    const desiredRole = formData.get("desiredRole") as string | null;

    // Get the default Claude model from app settings
    const model = await getDefaultClaudeModel();

    logger.info("Form data parsed", {
      filesCount: files.length,
      hasFreeText: !!freeText,
      freeTextLength: freeText?.length || 0,
      hasDesiredRole: !!desiredRole,
      desiredRole,
      model,
      fileDetails: files.map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
      })),
    });

    // Validate that desired role is provided
    if (!desiredRole || !desiredRole.trim()) {
      logger.warn("No desired role provided");
      return NextResponse.json(
        { error: "Desired role is required" },
        { status: 400 }
      );
    }

    // Validate files
    logger.debug("Validating files");

    if (files.length > MAX_FILES) {
      logger.warn("Too many files uploaded", { filesCount: files.length, maxFiles: MAX_FILES });
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        logger.warn("File too large", { fileName: file.name, size: file.size, maxSize: MAX_FILE_SIZE });
        return NextResponse.json(
          { error: `File ${file.name} exceeds maximum size of 10MB` },
          { status: 400 }
        );
      }

      if (!ALLOWED_FILE_TYPES.includes(file.type as any)) {
        logger.warn("Invalid file type", { fileName: file.name, type: file.type, allowedTypes: ALLOWED_FILE_TYPES });
        return NextResponse.json(
          { error: `File type ${file.type} not allowed` },
          { status: 400 }
        );
      }
    }

    logger.info("Files validated successfully");

    // Create initial profile analysis record
    logger.debug("Creating profile analysis record in database");

    const profileAnalysis = await db.profileAnalysis.create({
      data: {
        userId: user.id,
        freeText: freeText || undefined,
        uploadedFiles: [],
        analysisStatus: "processing",
      },
    });

    logger.info("Profile analysis record created", { profileAnalysisId: profileAnalysis.id });

    let uploadedFilePaths: string[] = [];

    try {
      // Save uploaded files (but we won't use them for analysis)
      logger.info("Processing uploaded files", { filesCount: files.length });

      for (const file of files) {
        const filepath = await saveUploadedFile(file, user.id);
        uploadedFilePaths.push(filepath);
      }

      logger.info("All files processed", {
        uploadedCount: uploadedFilePaths.length,
      });

      // Update with uploaded file paths
      logger.debug("Updating profile analysis with file paths");

      await db.profileAnalysis.update({
        where: { id: profileAnalysis.id },
        data: { uploadedFiles: uploadedFilePaths },
      });

      // Analyze with Claude using ONLY the desired role
      logger.info("Starting Claude analysis using desired role only", {
        desiredRole: desiredRole.trim(),
      });

      const result = await analyzeProfileWithClaude({
        desiredRole: desiredRole.trim(),
        model: model as any,
      });

      const { analysis, prompt, model: usedModel, rawAnalysis, claudeResponse } = result;

      logger.info("Claude analysis completed", {
        model: usedModel,
        hasRole: !!analysis.role,
        hasSeniority: !!analysis.seniority,
        rawAnalysisSize: JSON.stringify(rawAnalysis).length,
        claudeResponseSize: claudeResponse.length,
      });

      // Update profile analysis with results
      logger.debug("Saving analysis results to database");

      const updatedAnalysis = await db.profileAnalysis.update({
        where: { id: profileAnalysis.id },
        data: {
          role: analysis.role,
          seniority: analysis.seniority,
          sectors: analysis.sectors || [],
          skills: analysis.skills as any,
          workExperiences: analysis.workExperiences as any,
          education: analysis.education as any,
          personalProjects: analysis.personalProjects as any,
          additionalData: {
            ...analysis.additionalData,
            summary: analysis.summary,
            prompt, // Include the prompt in additional data
            model: usedModel, // Include the model used
            desiredRole: desiredRole.trim(), // Include desired role
          } as any,
          // Save complete raw JSON data from Claude
          rawAnalysis: rawAnalysis as any,
          claudeResponse: claudeResponse,
          analysisStatus: "completed",
        },
      });

      logger.info("Raw analysis data saved to database", {
        profileAnalysisId: updatedAnalysis.id,
        rawAnalysisSaved: !!updatedAnalysis.rawAnalysis,
        claudeResponseSaved: !!updatedAnalysis.claudeResponse,
      });

      logger.info("Profile analysis completed successfully", {
        profileAnalysisId: updatedAnalysis.id,
        userId: user.id,
        model: usedModel,
      });

      logComplete();

      return NextResponse.json({
        success: true,
        data: updatedAnalysis,
        prompt, // Return prompt to frontend
        model: usedModel, // Return model used
        rawAnalysis, // Return complete raw JSON
        claudeResponse, // Return raw text response
      });
    } catch (error) {
      logger.error("Profile analysis failed", error, {
        profileAnalysisId: profileAnalysis.id,
        userId: user.id,
        uploadedFilesCount: uploadedFilePaths.length,
      });

      // Update status to failed
      logger.debug("Updating profile analysis status to failed");

      await db.profileAnalysis.update({
        where: { id: profileAnalysis.id },
        data: {
          analysisStatus: "failed",
          errorMessage: error instanceof Error ? error.message : "Unknown error",
        },
      });

      // Clean up uploaded files on error
      if (uploadedFilePaths.length > 0) {
        logger.info("Cleaning up uploaded files after error", {
          filesCount: uploadedFilePaths.length,
        });
        await deleteUploadedFiles(uploadedFilePaths);
      }

      throw error;
    }
  } catch (error) {
    logger.error("Unhandled error in POST /api/analyze-profile", error);
    return NextResponse.json(
      {
        error: "Failed to analyze profile",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user's profile analyses
export async function GET() {
  const logComplete = logger.startOperation("GET /api/analyze-profile");

  try {
    logger.info("Fetching user's profile analyses");

    const { userId: clerkId } = await auth();

    if (!clerkId) {
      logger.warn("Unauthorized GET request - no clerkId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.debug("User authenticated for GET", { clerkId });

    const user = await db.user.findUnique({
      where: { clerkId },
      include: {
        profileAnalysis: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      logger.error("User not found in GET", undefined, { clerkId });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    logger.info("Profile analyses fetched successfully", {
      userId: user.id,
      analysesCount: user.profileAnalysis.length,
    });

    logComplete();

    return NextResponse.json({
      success: true,
      data: user.profileAnalysis,
    });
  } catch (error) {
    logger.error("Error fetching profile analyses", error);
    return NextResponse.json(
      { error: "Failed to fetch profile analyses" },
      { status: 500 }
    );
  }
}
