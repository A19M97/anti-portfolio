import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isAdminByClerkId } from "@/lib/auth/permissions";
import { getDefaultClaudeModel, updateDefaultClaudeModel } from "@/lib/settings";
import { claudeModelSchema, CLAUDE_MODELS } from "@/lib/validations/profile-analysis";
import { loggers } from "@/lib/logger";

const logger = loggers.api;

export async function GET() {
  const logComplete = logger.startOperation("GET /api/settings");

  try {
    logger.info("Fetching app settings");

    // Check authentication
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      logger.warn("Unauthorized GET request - no clerkId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.debug("User authenticated", { clerkId });

    // Get default Claude model
    const defaultModel = await getDefaultClaudeModel();

    logger.info("Settings fetched successfully", { defaultModel });

    logComplete();

    return NextResponse.json({
      success: true,
      settings: {
        defaultClaudeModel: defaultModel,
      },
    });
  } catch (error) {
    logger.error("Error fetching settings", error);
    return NextResponse.json(
      {
        error: "Failed to fetch settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const logComplete = logger.startOperation("PUT /api/settings");

  try {
    logger.info("Updating app settings");

    // Check authentication
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      logger.warn("Unauthorized PUT request - no clerkId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.debug("User authenticated", { clerkId });

    // Check if user is admin
    const userIsAdmin = await isAdminByClerkId(clerkId);

    if (!userIsAdmin) {
      logger.warn("Forbidden PUT request - user is not admin", { clerkId });
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    logger.debug("User is admin", { clerkId });

    // Parse request body
    const body = await request.json();

    // Validate model
    const modelValidation = claudeModelSchema.safeParse(body.defaultClaudeModel);

    if (!modelValidation.success) {
      logger.warn("Invalid model provided", {
        model: body.defaultClaudeModel,
        errors: modelValidation.error.errors,
      });
      return NextResponse.json(
        {
          error: "Invalid Claude model",
          details: modelValidation.error.errors,
        },
        { status: 400 }
      );
    }

    // Update settings
    await updateDefaultClaudeModel(modelValidation.data);

    logger.info("Settings updated successfully", {
      defaultModel: modelValidation.data,
    });

    logComplete();

    return NextResponse.json({
      success: true,
      settings: {
        defaultClaudeModel: modelValidation.data,
      },
    });
  } catch (error) {
    logger.error("Error updating settings", error);
    return NextResponse.json(
      {
        error: "Failed to update settings",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
