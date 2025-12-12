import Anthropic from "@anthropic-ai/sdk";
import {
  llmAnalysisOutputSchema,
  type LLMAnalysisOutput,
  type ClaudeModel,
  CLAUDE_MODELS
} from "./validations/profile-analysis";
import { loggers } from "./logger";

const logger = loggers.anthropic;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

logger.info("Anthropic client initialized", {
  hasApiKey: !!process.env.ANTHROPIC_API_KEY,
});

export interface DocumentFile {
  data: string; // base64
  mediaType: string;
  isDocument: boolean;
}

export interface AnalyzeProfileParams {
  documents: DocumentFile[];
  freeText?: string;
  model?: ClaudeModel;
}

export interface AnalyzeProfileResult {
  analysis: LLMAnalysisOutput;
  prompt: string;
  model: string;
  rawAnalysis: any; // Raw parsed JSON from Claude (before validation)
  claudeResponse: string; // Raw text response from Claude API
}

/**
 * Analyzes profile data using Claude and returns structured JSON output
 */
export async function analyzeProfileWithClaude(
  params: AnalyzeProfileParams
): Promise<AnalyzeProfileResult> {
  const { documents, freeText, model = CLAUDE_MODELS.HAIKU } = params;

  const logComplete = logger.startOperation("analyzeProfileWithClaude", {
    documentCount: documents.length,
    hasFreeText: !!freeText,
    freeTextLength: freeText?.length || 0,
    model,
  });

  logger.info("Starting profile analysis", {
    documents: documents.map((d) => ({
      mediaType: d.mediaType,
      isDocument: d.isDocument,
      dataLength: d.data.length,
    })),
    model,
  });

  const prompt = `You are an expert career analyst. Analyze the provided professional documents (CV, LinkedIn profile, etc.) ${freeText ? "and additional information" : ""} to extract structured data about this person's professional profile.

${freeText ? `\n\nAdditional Information:\n${freeText}\n` : ""}

Based on the documents provided, extract and return a JSON object with the following structure:
{
  "role": "Current or most recent professional role/title",
  "seniority": "Professional level (e.g., Junior, Mid-level, Senior, Lead, Principal, etc.)",
  "sectors": ["Array of industry sectors they have experience in"],
  "skills": [
    {
      "name": "Skill or technology name",
      "category": "Category (e.g., Frontend, Backend, DevOps, Design, etc.)",
      "proficiency": "Level (e.g., Beginner, Intermediate, Advanced, Expert)"
    }
  ],
  "workExperiences": [
    {
      "company": "Company name",
      "position": "Job title",
      "startDate": "Start date (format: YYYY-MM or similar)",
      "endDate": "End date or 'Present'",
      "description": "Brief description of role and achievements",
      "technologies": ["Technologies used in this role"]
    }
  ],
  "education": [
    {
      "institution": "School/University name",
      "degree": "Degree type (e.g., Bachelor's, Master's, PhD)",
      "field": "Field of study",
      "startDate": "Start date",
      "endDate": "End date",
      "description": "Additional details, honors, etc."
    }
  ],
  "personalProjects": [
    {
      "name": "Project name",
      "description": "Project description",
      "technologies": ["Technologies used"],
      "url": "Live URL if available",
      "repository": "GitHub or other repository URL"
    }
  ],
  "summary": "A concise professional summary (2-3 sentences) highlighting key strengths and experience",
  "additionalData": {
    // Any other relevant information that doesn't fit the above categories
    // Examples: languages spoken, certifications, publications, awards, etc.
  }
}

IMPORTANT:
- Only include fields where you have confident information from the documents
- If a field cannot be determined, omit it or use null
- Be precise and factual - don't invent information
- For dates, preserve the format from the original documents
- Extract as much detail as possible while maintaining accuracy
- Return ONLY valid JSON, no additional text or explanation`;

  // Build content blocks: documents first, then text prompt
  logger.debug("Building content blocks for Claude API");
  const contentBlocks: Anthropic.MessageParam["content"] = [];

  // Add document blocks for PDFs and other files
  for (const doc of documents) {
    if (doc.isDocument && doc.mediaType === "application/pdf") {
      // PDF documents
      logger.debug("Adding PDF document block", {
        mediaType: doc.mediaType,
        base64Length: doc.data.length,
      });
      contentBlocks.push({
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: doc.data,
        },
      } as any);
    } else {
      // Text files - decode base64 and add as text
      const textContent = Buffer.from(doc.data, "base64").toString("utf-8");
      logger.debug("Adding text document block", {
        mediaType: doc.mediaType,
        textLength: textContent.length,
      });
      contentBlocks.push({
        type: "text",
        text: `--- Document (${doc.mediaType}) ---\n${textContent}`,
      });
    }
  }

  // Add the main prompt
  contentBlocks.push({
    type: "text",
    text: prompt,
  });

  logger.info("Sending request to Claude API", {
    model,
    contentBlockCount: contentBlocks.length,
    maxTokens: 4096,
    promptLength: prompt.length,
  });

  const apiCallStart = Date.now();
  const message = await anthropic.messages.create({
    model: model,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: contentBlocks,
      },
    ],
  });
  const apiCallDuration = Date.now() - apiCallStart;

  logger.info("Received response from Claude API", {
    durationMs: apiCallDuration,
    stopReason: message.stop_reason,
    inputTokens: message.usage.input_tokens,
    outputTokens: message.usage.output_tokens,
    totalTokens: message.usage.input_tokens + message.usage.output_tokens,
  });

  // Extract JSON from Claude's response
  const responseText = message.content[0].type === "text" ? message.content[0].text : "";

  logger.debug("Extracting JSON from Claude response", {
    responseLength: responseText.length,
    responsePreview: responseText.substring(0, 200),
  });

  // Try to parse JSON from the response
  let parsedData: LLMAnalysisOutput;
  try {
    // Sometimes Claude wraps JSON in markdown code blocks
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
                      responseText.match(/```\n?([\s\S]*?)\n?```/);
    const jsonString = jsonMatch ? jsonMatch[1] : responseText;

    logger.debug("Parsing JSON string", {
      hadCodeBlock: !!jsonMatch,
      jsonLength: jsonString.length,
    });

    parsedData = JSON.parse(jsonString.trim());

    logger.debug("JSON parsed successfully", {
      keys: Object.keys(parsedData),
    });
  } catch (error) {
    logger.error("Failed to parse Claude response as JSON", error, {
      responseText: responseText.substring(0, 500),
      responseLength: responseText.length,
    });
    throw new Error("Failed to parse LLM response as valid JSON");
  }

  // Validate the parsed data against our schema
  logger.debug("Validating parsed data against schema");
  try {
    const validatedData = llmAnalysisOutputSchema.parse(parsedData);

    logger.info("Profile analysis completed successfully", {
      hasRole: !!validatedData.role,
      hasSeniority: !!validatedData.seniority,
      sectorsCount: validatedData.sectors?.length || 0,
      skillsCount: validatedData.skills?.length || 0,
      workExperiencesCount: validatedData.workExperiences?.length || 0,
      educationCount: validatedData.education?.length || 0,
      projectsCount: validatedData.personalProjects?.length || 0,
    });

    logger.info("Returning complete analysis data including raw JSON", {
      rawAnalysisSize: JSON.stringify(parsedData).length,
      claudeResponseSize: responseText.length,
    });

    logComplete();

    return {
      analysis: validatedData,
      prompt,
      model,
      rawAnalysis: parsedData, // Complete parsed JSON before validation
      claudeResponse: responseText, // Raw text response from Claude
    };
  } catch (error) {
    logger.error("Schema validation failed", error, {
      parsedDataKeys: Object.keys(parsedData),
    });
    throw error;
  }
}
