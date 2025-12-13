import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import { join } from "path";
import { loggers } from "@/lib/logger";
import { CLAUDE_MODELS, type ClaudeModel } from "@/lib/validations/profile-analysis";

const logger = loggers.api;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ScenarioMessage {
  type: "BRIEF" | "TEAM" | "TIMELINE" | "TASK";
  content: string;
}

/**
 * Formats the profile data into the format expected by the system prompt
 */
function formatProfileForPrompt(profileAnalysis: any): string {
  const rawData = profileAnalysis.rawAnalysis || {};

  // Map seniority to the format expected by the prompt
  const seniorityMap: Record<string, string> = {
    "Junior": "Junior (0-2 anni)",
    "Mid-level": "Mid (2-5 anni)",
    "Mid": "Mid (2-5 anni)",
    "Senior": "Senior (5-10 anni)",
    "Lead": "Lead/Principal (10+ anni)",
    "Principal": "Lead/Principal (10+ anni)",
  };

  const seniority = seniorityMap[profileAnalysis.seniority] || profileAnalysis.seniority || "Mid (2-5 anni)";

  return `PROFILO UTENTE:
- Nome: ${rawData.summary?.split(" ")[0] || "Utente"}
- Ruolo: ${profileAnalysis.role || "Product Manager"}
- Seniority: ${seniority}
- Contesto preferito: Startup growth
- Tipo sfida: Crisis Management
- Durata: Standard (10 decisioni)
- Tono: Professionale`;
}

/**
 * Parses the Claude response into structured messages
 */
function parseScenarioMessages(responseText: string): ScenarioMessage[] {
  const messages: ScenarioMessage[] = [];

  // Split by the separator ---
  const sections = responseText.split(/\n---\n/).map(s => s.trim()).filter(Boolean);

  for (const section of sections) {
    // Detect message type based on content
    if (section.includes("[BRIEF]") || section.includes("📋 SCENARIO:")) {
      messages.push({
        type: "BRIEF",
        content: section.replace("[BRIEF]", "").trim(),
      });
    } else if (section.includes("[TEAM]") || section.includes("👥 IL TUO TEAM")) {
      messages.push({
        type: "TEAM",
        content: section.replace("[TEAM]", "").trim(),
      });
    } else if (section.includes("[TIMELINE]") || section.includes("📅 TIMELINE")) {
      messages.push({
        type: "TIMELINE",
        content: section.replace("[TIMELINE]", "").trim(),
      });
    } else if (section.includes("[TASK]") || section.includes("📌 TASK")) {
      messages.push({
        type: "TASK",
        content: section.replace("[TASK]", "").trim(),
      });
    }
  }

  return messages;
}

export async function POST(req: Request) {
  const logComplete = logger.startOperation("POST /api/generate-scenario");

  try {
    logger.info("Received scenario generation request");

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
      include: {
        profileAnalysis: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      logger.error("User not found in database", undefined, { clerkId });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the latest profile analysis
    const profileAnalysis = user.profileAnalysis[0];

    if (!profileAnalysis) {
      logger.warn("No profile analysis found for user", { userId: user.id });
      return NextResponse.json(
        { error: "No profile analysis found. Please complete the onboarding first." },
        { status: 404 }
      );
    }

    logger.info("Profile analysis found", {
      profileAnalysisId: profileAnalysis.id,
      hasRole: !!profileAnalysis.role,
      hasSeniority: !!profileAnalysis.seniority,
    });

    // Get the model from profile analysis, fallback to Haiku if not found
    const savedModel = (profileAnalysis.additionalData as any)?.model as ClaudeModel | undefined;
    const modelToUse = savedModel || CLAUDE_MODELS.HAIKU;

    logger.info("Model selection", {
      savedModel,
      modelToUse,
      hasSavedModel: !!savedModel,
    });

    // Read the system prompt from docs/system-prompt.md
    logger.debug("Reading system prompt from file");
    const systemPromptPath = join(process.cwd(), "docs", "system-prompt.md");
    const systemPrompt = await readFile(systemPromptPath, "utf-8");

    logger.info("System prompt loaded", {
      systemPromptLength: systemPrompt.length,
    });

    // Format the profile data
    const formattedProfile = formatProfileForPrompt(profileAnalysis);

    logger.debug("Profile formatted for prompt", {
      formattedProfileLength: formattedProfile.length,
    });

    // Combine system prompt with profile data
    const fullPrompt = `${systemPrompt}

---

${formattedProfile}

Genera ora lo scenario iniziale seguendo esattamente il formato specificato sopra.`;

    logger.info("Calling Claude API for scenario generation", {
      fullPromptLength: fullPrompt.length,
      model: modelToUse,
    });

    // Call Claude API with the selected model
    const apiCallStart = Date.now();
    const message = await anthropic.messages.create({
      model: modelToUse,
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
    });
    const apiCallDuration = Date.now() - apiCallStart;

    logger.info("Received response from Claude API", {
      durationMs: apiCallDuration,
      stopReason: message.stop_reason,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    });

    // Extract text from response
    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    logger.debug("Response text extracted", {
      responseLength: responseText.length,
    });

    // Parse the response into structured messages
    const messages = parseScenarioMessages(responseText);

    logger.info("Scenario messages parsed", {
      messagesCount: messages.length,
      types: messages.map(m => m.type),
    });

    // Get default configuration or create simulation without config
    const defaultConfig = await db.simulationConfig.findFirst({
      where: { isDefault: true },
    });

    logger.debug("Default config found", {
      configId: defaultConfig?.id,
      configName: defaultConfig?.name,
    });

    // Extract scenario title from first BRIEF message
    const briefMessage = messages.find((m) => m.type === "BRIEF");
    const scenarioTitle = briefMessage
      ? briefMessage.content
          .split("\n")[0]
          .replace(/^#\s*/, "")
          .substring(0, 100)
      : "Nuova Simulazione";

    logger.debug("Extracted scenario title", { scenarioTitle });

    // Create simulation record in database
    const simulation = await db.simulation.create({
      data: {
        userId: user.id,
        profileAnalysisId: profileAnalysis.id,
        configId: defaultConfig?.id,
        scenarioTitle,
        totalTasks: defaultConfig?.tasksCount || 10,
        status: "active",
        messages: {
          create: messages.map((msg, index) => ({
            role: "assistant",
            content: msg.content,
            type: msg.type,
            orderIndex: index,
          })),
        },
      },
      include: {
        messages: true,
      },
    });

    logger.info("Simulation created in database", {
      simulationId: simulation.id,
      messagesCount: simulation.messages.length,
    });

    logger.info("Scenario generation completed successfully", {
      userId: user.id,
      simulationId: simulation.id,
      messagesCount: messages.length,
      modelUsed: modelToUse,
    });

    logComplete();

    return NextResponse.json({
      success: true,
      simulationId: simulation.id,
      messages,
      rawResponse: responseText,
      model: modelToUse,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    });
  } catch (error) {
    logger.error("Unhandled error in POST /api/generate-scenario", error);
    return NextResponse.json(
      {
        error: "Failed to generate scenario",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
