import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { loggers } from "@/lib/logger";
import { CLAUDE_MODELS, type ClaudeModel } from "@/lib/validations/profile-analysis";

const logger = loggers.api;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ContinueSimulationRequest {
  simulationId: string;
  userMessage: string;
}

interface ScenarioMessage {
  type: "BRIEF" | "TEAM" | "TIMELINE" | "TASK" | "FEEDBACK" | "CHALLENGE";
  content: string;
}

/**
 * Parses the Claude response for continuation
 */
function parseContinuationResponse(responseText: string, shouldBeChallenge: boolean): ScenarioMessage {
  // Detect if it's a challenge based on keywords or the shouldBeChallenge flag
  const hasChallengKeywords = responseText.toLowerCase().includes("sfida") ||
                              responseText.toLowerCase().includes("critico") ||
                              responseText.toLowerCase().includes("urgente") ||
                              responseText.toLowerCase().includes("emergenza");

  const isChallenge = shouldBeChallenge || hasChallengKeywords;

  // Detect if it's just feedback
  const isFeedback = responseText.toLowerCase().includes("feedback") ||
                     responseText.toLowerCase().includes("valutazione");

  return {
    type: isChallenge ? "CHALLENGE" : (isFeedback ? "FEEDBACK" : "TASK"),
    content: responseText.trim(),
  };
}

export async function POST(req: Request) {
  const logComplete = logger.startOperation("POST /api/continue-simulation");

  try {
    logger.info("Received simulation continuation request");

    // Check authentication
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      logger.warn("Unauthorized request - no clerkId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.debug("User authenticated", { clerkId });

    // Parse request body
    const body: ContinueSimulationRequest = await req.json();
    const { simulationId, userMessage } = body;

    if (!simulationId || !userMessage) {
      logger.warn("Missing required fields", { simulationId: !!simulationId, userMessage: !!userMessage });
      return NextResponse.json(
        { error: "Missing required fields: simulationId and userMessage" },
        { status: 400 }
      );
    }

    logger.info("Request validated", {
      simulationId,
      userMessageLength: userMessage.length,
    });

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId },
    });

    if (!user) {
      logger.error("User not found in database", undefined, { clerkId });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get simulation with messages
    const simulation = await db.simulation.findUnique({
      where: { id: simulationId },
      include: {
        messages: {
          orderBy: { orderIndex: "asc" },
        },
        profileAnalysis: true,
        config: true,
      },
    });

    if (!simulation) {
      logger.error("Simulation not found", undefined, { simulationId });
      return NextResponse.json({ error: "Simulation not found" }, { status: 404 });
    }

    // Verify ownership
    if (simulation.userId !== user.id) {
      logger.warn("Unauthorized access to simulation", {
        userId: user.id,
        simulationUserId: simulation.userId,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    logger.info("Simulation loaded", {
      simulationId: simulation.id,
      messagesCount: simulation.messages.length,
      status: simulation.status,
    });

    // Check if simulation is still active
    if (simulation.status !== "active") {
      logger.warn("Attempting to continue inactive simulation", {
        simulationId,
        status: simulation.status,
      });
      return NextResponse.json(
        { error: `Simulation is ${simulation.status}. Cannot continue.` },
        { status: 400 }
      );
    }

    // Get the model from profile analysis
    const savedModel = (simulation.profileAnalysis.additionalData as any)?.model as ClaudeModel | undefined;
    const modelToUse = savedModel || CLAUDE_MODELS.HAIKU;

    logger.info("Model selection", {
      savedModel,
      modelToUse,
    });

    // Save user message first
    const nextOrderIndex = simulation.messages.length;
    const userMessageRecord = await db.simulationMessage.create({
      data: {
        simulationId: simulation.id,
        role: "user",
        content: userMessage,
        orderIndex: nextOrderIndex,
      },
    });

    logger.info("User message saved", {
      messageId: userMessageRecord.id,
      orderIndex: nextOrderIndex,
    });

    // Build conversation history for Claude
    const conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

    // Add all previous messages
    for (const msg of simulation.messages) {
      conversationHistory.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }

    // Add the new user message
    conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    logger.debug("Conversation history built", {
      historyLength: conversationHistory.length,
    });

    // Determine if this should be a challenge
    const challengesCount = simulation.config?.challengesCount || 0;
    const tasksRemaining = simulation.totalTasks - (simulation.completedTasks + 1);
    const challengesInserted = simulation.messages.filter(m => m.type === "CHALLENGE").length;
    const challengesRemaining = Math.max(0, challengesCount - challengesInserted);

    // Calculate probability of a challenge (distribute remaining challenges across remaining tasks)
    const shouldBeChallenge = tasksRemaining > 0 &&
                             challengesRemaining > 0 &&
                             Math.random() < (challengesRemaining / tasksRemaining);

    logger.info("Challenge calculation", {
      challengesCount,
      challengesInserted,
      challengesRemaining,
      tasksRemaining,
      shouldBeChallenge,
    });

    // Check if this is the final task completion
    const newCompletedTasks = simulation.completedTasks + 1;
    const isCompleted = newCompletedTasks >= simulation.totalTasks;

    // If simulation is completed, don't generate AI response - just mark as complete
    if (isCompleted) {
      logger.info("Simulation completed - not generating AI response", {
        completedTasks: newCompletedTasks,
        totalTasks: simulation.totalTasks,
      });

      await db.simulation.update({
        where: { id: simulation.id },
        data: {
          completedTasks: newCompletedTasks,
          currentTaskIndex: simulation.currentTaskIndex + 1,
          status: "completed",
          completedAt: new Date(),
        },
      });

      logger.info("Simulation marked as completed", {
        simulationId: simulation.id,
      });

      return NextResponse.json({
        success: true,
        isCompleted: true,
        simulation: {
          completedTasks: newCompletedTasks,
          totalTasks: simulation.totalTasks,
          isCompleted: true,
        },
      });
    }

    // Build system prompt for continuation
    const systemPrompt = `Sei un simulatore di scenari professionali. Stai continuando una simulazione interattiva.

CONTESTO:
- L'utente ha risposto a un task/decisione
- Task completati: ${newCompletedTasks}/${simulation.totalTasks}
- Mantieni coerenza con lo scenario e le decisioni precedenti

${shouldBeChallenge ?
  `⚠️ GENERA UNA SFIDA/EVENTO CRITICO:
  - Evento improvviso che complica la situazione
  - Deve essere conseguenza credibile del contesto
  - Richiede decisione rapida
  - Max 3-4 frasi di contesto + domanda diretta` :
  `GENERA IL PROSSIMO TASK:
  - Conseguenza naturale della decisione precedente
  - Max 3-4 frasi di contesto + domanda diretta`}

FORMATO RISPOSTA:
1. Breve feedback (1-2 frasi)
2. Conseguenze immediate
3. ${shouldBeChallenge ? 'SFIDA' : 'Task'} successivo

**MASSIMA CONCISIONE**: Solo info necessarie + minimo contesto. Tono professionale e diretto.`;

    logger.info("Calling Claude API for continuation", {
      model: modelToUse,
      systemPromptLength: systemPrompt.length,
      conversationLength: conversationHistory.length,
    });

    // Call Claude API
    const apiCallStart = Date.now();
    const claudeMessage = await anthropic.messages.create({
      model: modelToUse,
      max_tokens: 4096,
      system: systemPrompt,
      messages: conversationHistory,
    });
    const apiCallDuration = Date.now() - apiCallStart;

    logger.info("Received response from Claude API", {
      durationMs: apiCallDuration,
      stopReason: claudeMessage.stop_reason,
      inputTokens: claudeMessage.usage.input_tokens,
      outputTokens: claudeMessage.usage.output_tokens,
    });

    // Extract text from response
    const responseText = claudeMessage.content[0].type === "text" ? claudeMessage.content[0].text : "";

    logger.debug("Response text extracted", {
      responseLength: responseText.length,
    });

    // Parse the response
    const parsedResponse = parseContinuationResponse(responseText, shouldBeChallenge);

    // Save assistant response
    const assistantMessageRecord = await db.simulationMessage.create({
      data: {
        simulationId: simulation.id,
        role: "assistant",
        content: parsedResponse.content,
        type: parsedResponse.type,
        orderIndex: nextOrderIndex + 1,
      },
    });

    logger.info("Assistant message saved", {
      messageId: assistantMessageRecord.id,
      type: parsedResponse.type,
      orderIndex: nextOrderIndex + 1,
    });

    // Update simulation progress
    await db.simulation.update({
      where: { id: simulation.id },
      data: {
        completedTasks: newCompletedTasks,
        currentTaskIndex: simulation.currentTaskIndex + 1,
        status: "active",
      },
    });

    logger.info("Simulation progress updated", {
      completedTasks: newCompletedTasks,
      totalTasks: simulation.totalTasks,
      isCompleted: false,
    });

    logComplete();

    return NextResponse.json({
      success: true,
      message: {
        role: "assistant",
        content: parsedResponse.content,
        type: parsedResponse.type,
      },
      simulation: {
        completedTasks: newCompletedTasks,
        totalTasks: simulation.totalTasks,
        isCompleted: false,
      },
      usage: {
        inputTokens: claudeMessage.usage.input_tokens,
        outputTokens: claudeMessage.usage.output_tokens,
      },
    });
  } catch (error) {
    logger.error("Unhandled error in POST /api/continue-simulation", error);
    return NextResponse.json(
      {
        error: "Failed to continue simulation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
