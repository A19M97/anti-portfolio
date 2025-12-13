import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loggers } from "@/lib/logger";

const logger = loggers.api;

export async function GET() {
  const logComplete = logger.startOperation("GET /api/simulations");

  try {
    logger.info("Fetching user's simulations");

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
      include: {
        simulations: {
          orderBy: { updatedAt: "desc" },
          include: {
            messages: {
              orderBy: { orderIndex: "asc" },
              where: { type: "BRIEF" },
              take: 1,
            },
            _count: {
              select: { messages: true },
            },
          },
        },
      },
    });

    if (!user) {
      logger.error("User not found in database", undefined, { clerkId });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Format simulations for response
    const formattedSimulations = user.simulations.map((sim) => {
      // Extract scenario title from first BRIEF message or use fallback
      const briefMessage = sim.messages[0];
      const scenarioTitle =
        sim.scenarioTitle ||
        (briefMessage
          ? briefMessage.content
              .split("\n")[0]
              .replace(/^#\s*/, "")
              .substring(0, 100)
          : `Simulazione senza titolo - ${new Date(sim.createdAt).toLocaleDateString("it-IT")}`);

      return {
        id: sim.id,
        scenarioTitle,
        scenarioDescription: sim.scenarioDescription,
        status: sim.status,
        completedTasks: sim.completedTasks,
        totalTasks: sim.totalTasks,
        lastUpdated: sim.updatedAt,
        createdAt: sim.createdAt,
        messageCount: sim._count.messages,
      };
    });

    logger.info("Simulations fetched successfully", {
      userId: user.id,
      simulationsCount: formattedSimulations.length,
    });

    logComplete();

    return NextResponse.json({
      success: true,
      simulations: formattedSimulations,
    });
  } catch (error) {
    logger.error("Error fetching simulations", error);
    return NextResponse.json(
      {
        error: "Failed to fetch simulations",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
