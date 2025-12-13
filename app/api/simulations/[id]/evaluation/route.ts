import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { loggers } from "@/lib/logger";

const logger = loggers.api;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface EvaluationData {
  strengths: Array<{
    title: string;
    description: string;
    examples: string[];
  }>;
  weaknesses: Array<{
    title: string;
    description: string;
    suggestions: string[];
  }>;
  qualities: Array<{
    name: string;
    score: number;
    description: string;
  }>;
  overallAssessment: string;
  leadershipStyle?: string;
  decisionMaking?: string;
  communicationStyle?: string;
  problemSolving?: string;
  scores?: {
    overall?: number;
    leadership?: number;
    technical?: number;
    communication?: number;
    adaptability?: number;
  };
}

/**
 * Generates evaluation prompt for Claude
 */
function buildEvaluationPrompt(simulation: any, messages: any[]): string {
  const userMessages = messages.filter((m) => m.role === "user");
  const conversationContext = messages
    .map((m) => `${m.role.toUpperCase()} [${m.type || "MESSAGE"}]: ${m.content}`)
    .join("\n\n");

  return `Sei un esperto valutatore di competenze professionali. Hai appena osservato una simulazione completa dove un candidato ha affrontato ${simulation.totalTasks} decisioni/task in uno scenario realistico di lavoro.

CONTESTO SIMULAZIONE:
Titolo: ${simulation.scenarioTitle || "Scenario professionale"}
Task completati: ${simulation.completedTasks}/${simulation.totalTasks}
Durata: ${simulation.startedAt ? `Dal ${new Date(simulation.startedAt).toLocaleDateString('it-IT')} al ${new Date(simulation.completedAt || Date.now()).toLocaleDateString('it-IT')}` : 'N/A'}

CONVERSAZIONE COMPLETA:
${conversationContext}

La tua missione è fornire una valutazione qualitativa APPROFONDITA e DETTAGLIATA della performance del candidato.

IMPORTANTE:
- Analizza TUTTI i messaggi dell'utente, non solo gli ultimi
- Identifica pattern ricorrenti nelle risposte
- Valuta la qualità delle decisioni, non solo la quantità
- Fornisci esempi specifici tratti dalle risposte effettive del candidato
- Sii costruttivo ma onesto nelle valutazioni

Rispondi ESCLUSIVAMENTE in formato JSON con questa struttura:

{
  "strengths": [
    {
      "title": "Nome del punto di forza",
      "description": "Descrizione dettagliata di cosa dimostra questo punto di forza",
      "examples": ["Esempio specifico 1 dalla simulazione", "Esempio specifico 2"]
    }
  ],
  "weaknesses": [
    {
      "title": "Nome dell'area di miglioramento",
      "description": "Descrizione dettagliata di cosa potrebbe migliorare",
      "suggestions": ["Suggerimento pratico 1", "Suggerimento pratico 2"]
    }
  ],
  "qualities": [
    {
      "name": "Leadership",
      "score": 85,
      "description": "Valutazione della capacità di leadership dimostrata"
    },
    {
      "name": "Comunicazione",
      "score": 75,
      "description": "Valutazione delle capacità comunicative"
    },
    {
      "name": "Problem Solving",
      "score": 90,
      "description": "Valutazione della capacità di risolvere problemi"
    },
    {
      "name": "Adattabilità",
      "score": 70,
      "description": "Valutazione della capacità di adattarsi a situazioni nuove"
    },
    {
      "name": "Visione Strategica",
      "score": 80,
      "description": "Valutazione della capacità di pensiero strategico"
    }
  ],
  "overallAssessment": "Una valutazione narrativa complessiva di 3-4 paragrafi che sintetizza il profilo emerso dalla simulazione, evidenziando il potenziale del candidato e le aree di crescita.",
  "leadershipStyle": "Descrizione dello stile di leadership emerso (es. collaborativo, direttivo, coaching, visionario)",
  "decisionMaking": "Descrizione dell'approccio al decision making (es. data-driven, intuitivo, collaborativo, deliberato)",
  "communicationStyle": "Descrizione dello stile comunicativo (es. diretto, empatico, analitico, sintetico)",
  "problemSolving": "Descrizione dell'approccio al problem solving (es. metodico, creativo, pragmatico, analitico)",
  "scores": {
    "overall": 78,
    "leadership": 85,
    "technical": 75,
    "communication": 80,
    "adaptability": 70
  }
}

REQUISITI:
- Identifica almeno 3-5 punti di forza
- Identifica almeno 2-4 aree di miglioramento
- Fornisci esattamente 5 qualità con score da 0 a 100
- Ogni score deve essere giustificato dalla description
- Gli esempi devono essere SPECIFICI e tratti dalle risposte reali
- La valutazione complessiva deve essere narrativa e approfondita
- I punteggi devono essere realistici e ben calibrati

Rispondi SOLO con il JSON, senza testo aggiuntivo prima o dopo.`;
}

/**
 * Parses Claude's JSON response
 */
function parseEvaluationResponse(responseText: string): EvaluationData {
  try {
    // Remove markdown code blocks if present
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    const parsed = JSON.parse(cleanedText);
    return parsed;
  } catch (error) {
    logger.error("Failed to parse evaluation response", error, { responseText });
    throw new Error("Invalid evaluation response format");
  }
}

// GET - Retrieve existing evaluation (public access)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const logComplete = logger.startOperation("GET /api/simulations/[id]/evaluation");

  try {
    const { id: simulationId } = await params;
    logger.info("Fetching evaluation for simulation (public)", { simulationId });

    // Fetch simulation with evaluation (public access)
    const simulation = await db.simulation.findUnique({
      where: { id: simulationId },
      include: {
        evaluation: true,
      },
    });

    if (!simulation) {
      logger.warn("Simulation not found", { simulationId });
      return NextResponse.json(
        { error: "Simulation not found" },
        { status: 404 }
      );
    }

    // Check if evaluation exists
    if (!simulation.evaluation) {
      logger.info("No evaluation found for simulation", { simulationId });
      return NextResponse.json(
        {
          success: false,
          exists: false,
          message: "Evaluation not generated yet"
        },
        { status: 404 }
      );
    }

    logger.info("Evaluation fetched successfully", {
      simulationId,
    });

    logComplete();

    return NextResponse.json({
      success: true,
      exists: true,
      evaluation: simulation.evaluation,
    });
  } catch (error) {
    logger.error("Error fetching evaluation", error);
    return NextResponse.json(
      {
        error: "Failed to fetch evaluation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Generate new evaluation
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const logComplete = logger.startOperation("POST /api/simulations/[id]/evaluation");

  try {
    const { id: simulationId } = await params;
    logger.info("Generating evaluation for simulation", { simulationId });

    // Check authentication
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      logger.warn("Unauthorized POST request - no clerkId");
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

    // Fetch simulation with messages and profile
    const simulation = await db.simulation.findUnique({
      where: { id: simulationId },
      include: {
        messages: {
          orderBy: { orderIndex: "asc" },
        },
        profileAnalysis: true,
        evaluation: true,
      },
    });

    if (!simulation) {
      logger.warn("Simulation not found", { simulationId });
      return NextResponse.json(
        { error: "Simulation not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (simulation.userId !== user.id) {
      logger.warn("Unauthorized access to simulation", {
        userId: user.id,
        simulationUserId: simulation.userId,
        simulationId,
      });
      return NextResponse.json(
        { error: "Unauthorized - You don't own this simulation" },
        { status: 403 }
      );
    }

    // Check if simulation is completed
    if (simulation.status !== "completed") {
      logger.warn("Cannot evaluate incomplete simulation", {
        simulationId,
        status: simulation.status
      });
      return NextResponse.json(
        { error: "Simulation must be completed before evaluation" },
        { status: 400 }
      );
    }

    // Check if evaluation already exists
    if (simulation.evaluation) {
      logger.info("Evaluation already exists, returning existing", { simulationId });
      return NextResponse.json({
        success: true,
        evaluation: simulation.evaluation,
        cached: true,
      });
    }

    // Build evaluation prompt
    const prompt = buildEvaluationPrompt(simulation, simulation.messages);

    logger.debug("Calling Claude API for evaluation", {
      simulationId,
      messageCount: simulation.messages.length,
    });

    // Get model from profile analysis or use default
    const modelToUse = (simulation.profileAnalysis?.additionalData as any)?.model || "claude-3-5-sonnet-20241022";

    // Call Claude API
    const response = await anthropic.messages.create({
      model: modelToUse,
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = response.content[0].type === "text"
      ? response.content[0].text
      : "";

    logger.debug("Received Claude response", {
      length: responseText.length,
      usage: response.usage,
    });

    // Parse evaluation response
    const evaluationData = parseEvaluationResponse(responseText);

    logger.debug("Parsed evaluation data", {
      strengthsCount: evaluationData.strengths.length,
      weaknessesCount: evaluationData.weaknesses.length,
      qualitiesCount: evaluationData.qualities.length,
    });

    // Save evaluation to database (upsert to handle edge cases)
    const evaluation = await db.simulationEvaluation.upsert({
      where: {
        simulationId: simulation.id,
      },
      create: {
        simulationId: simulation.id,
        strengths: evaluationData.strengths,
        weaknesses: evaluationData.weaknesses,
        qualities: evaluationData.qualities,
        overallAssessment: evaluationData.overallAssessment,
        leadershipStyle: evaluationData.leadershipStyle,
        decisionMaking: evaluationData.decisionMaking,
        communicationStyle: evaluationData.communicationStyle,
        problemSolving: evaluationData.problemSolving,
        overallScore: evaluationData.scores?.overall,
        leadershipScore: evaluationData.scores?.leadership,
        technicalScore: evaluationData.scores?.technical,
        communicationScore: evaluationData.scores?.communication,
        adaptabilityScore: evaluationData.scores?.adaptability,
        modelUsed: modelToUse,
      },
      update: {
        strengths: evaluationData.strengths,
        weaknesses: evaluationData.weaknesses,
        qualities: evaluationData.qualities,
        overallAssessment: evaluationData.overallAssessment,
        leadershipStyle: evaluationData.leadershipStyle,
        decisionMaking: evaluationData.decisionMaking,
        communicationStyle: evaluationData.communicationStyle,
        problemSolving: evaluationData.problemSolving,
        overallScore: evaluationData.scores?.overall,
        leadershipScore: evaluationData.scores?.leadership,
        technicalScore: evaluationData.scores?.technical,
        communicationScore: evaluationData.scores?.communication,
        adaptabilityScore: evaluationData.scores?.adaptability,
        modelUsed: modelToUse,
      },
    });

    logger.info("Evaluation generated and saved successfully", {
      userId: user.id,
      simulationId,
      evaluationId: evaluation.id,
    });

    logComplete();

    return NextResponse.json({
      success: true,
      evaluation,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      model: modelToUse,
    });
  } catch (error) {
    logger.error("Error generating evaluation", error);
    return NextResponse.json(
      {
        error: "Failed to generate evaluation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
