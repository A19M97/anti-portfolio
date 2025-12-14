import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loggers } from "@/lib/logger";

const logger = loggers.api;

export async function GET(request: Request) {
  const logComplete = logger.startOperation("GET /api/feed");

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const role = searchParams.get("role");

    logger.info("Fetching public feed of completed simulations", { limit, role });

    // Fetch completed simulations with user and profile analysis
    const simulations = await db.simulation.findMany({
      where: {
        status: "completed",
        completedAt: { not: null },
        ...(role && {
          profileAnalysis: {
            role: {
              contains: role,
              mode: "insensitive"
            }
          }
        })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        profileAnalysis: {
          select: {
            role: true,
            seniority: true,
          },
        },
      },
      orderBy: { completedAt: "desc" },
      take: limit,
    });

    // Format the feed data
    const feedItems = simulations.map((sim) => {
      const nameParts = sim.user.name?.split(" ") || [];
      const firstName = nameParts[0] || "User";
      const lastName = nameParts.slice(1).join(" ") || "";
      const initials = `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;

      return {
        id: sim.id,
        userId: sim.user.id,
        user: {
          name: sim.user.name || "Anonymous User",
          firstName,
          lastName,
          initials,
        },
        role: sim.profileAnalysis?.role || "Unknown Role",
        seniority: sim.profileAnalysis?.seniority || null,
        scenarioTitle: sim.scenarioTitle || "Untitled Simulation",
        scenarioDescription: sim.scenarioDescription,
        companyName: sim.companyName,
        teamSize: sim.teamSize,
        score: sim.score,
        completedTasks: sim.completedTasks,
        totalTasks: sim.totalTasks,
        completedAt: sim.completedAt,
        createdAt: sim.createdAt,
      };
    });

    logger.info("Feed fetched successfully", {
      itemsCount: feedItems.length,
    });

    logComplete();

    return NextResponse.json({
      success: true,
      feed: feedItems,
      total: feedItems.length,
    });
  } catch (error) {
    logger.error("Error fetching feed", error);
    return NextResponse.json(
      {
        error: "Failed to fetch feed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
