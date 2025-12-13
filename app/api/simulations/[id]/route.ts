import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loggers } from "@/lib/logger";

const logger = loggers.api;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const logComplete = logger.startOperation("GET /api/simulations/[id]");

  try {
    const { id: simulationId } = await params;
    logger.info("Fetching simulation by ID (public)", { simulationId });

    // Fetch simulation with all messages (public access)
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
      logger.warn("Simulation not found", { simulationId });
      return NextResponse.json(
        { error: "Simulation not found" },
        { status: 404 }
      );
    }

    logger.info("Simulation fetched successfully", {
      simulationId,
      messageCount: simulation.messages.length,
    });

    logComplete();

    return NextResponse.json({
      success: true,
      simulation: {
        id: simulation.id,
        userId: simulation.userId,
        scenarioTitle: simulation.scenarioTitle,
        scenarioDescription: simulation.scenarioDescription,
        status: simulation.status,
        completedTasks: simulation.completedTasks,
        totalTasks: simulation.totalTasks,
        currentTaskIndex: simulation.currentTaskIndex,
        createdAt: simulation.createdAt,
        updatedAt: simulation.updatedAt,
        startedAt: simulation.startedAt,
        completedAt: simulation.completedAt,
        messages: simulation.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          type: msg.type,
          orderIndex: msg.orderIndex,
        })),
      },
    });
  } catch (error) {
    logger.error("Error fetching simulation", error);
    return NextResponse.json(
      {
        error: "Failed to fetch simulation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
