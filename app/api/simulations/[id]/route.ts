import { auth } from "@clerk/nextjs/server";
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
    logger.info("Fetching simulation by ID", { simulationId });

    // Check authentication
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      logger.warn("Unauthorized GET request - no clerkId");
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

    // Fetch simulation with all messages
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

    logger.info("Simulation fetched successfully", {
      userId: user.id,
      simulationId,
      messageCount: simulation.messages.length,
    });

    logComplete();

    return NextResponse.json({
      success: true,
      simulation: {
        id: simulation.id,
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
