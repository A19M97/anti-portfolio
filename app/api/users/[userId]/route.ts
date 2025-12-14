import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loggers } from "@/lib/logger";

const logger = loggers.api;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const logComplete = logger.startOperation("GET /api/users/[userId]");

  try {
    const { userId: targetUserId } = await params;

    logger.info("Fetching user details", { targetUserId });

    // Check authentication (optional for public access)
    const { userId: clerkId } = await auth();

    logger.debug("Auth check", { isAuthenticated: !!clerkId });

    // Get logged-in user (null if not authenticated)
    let loggedInUser = null;
    if (clerkId) {
      loggedInUser = await db.user.findUnique({
        where: { clerkId }
      });
      logger.debug("User authenticated", { clerkId, loggedInUserId: loggedInUser?.id });
    }

    // Fetch target user with simulations
    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      include: {
        simulations: {
          orderBy: { updatedAt: "desc" },
          include: {
            messages: {
              orderBy: { orderIndex: "asc" },
              where: { type: "BRIEF" },
              take: 1
            },
            _count: {
              select: { messages: true }
            }
          }
        }
      }
    });

    if (!targetUser) {
      logger.error("Target user not found", undefined, { targetUserId });
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // Check if logged-in user is viewing their own profile
    const isOwnProfile = loggedInUser ? loggedInUser.id === targetUserId : false;

    logger.debug("Profile ownership check", { isOwnProfile, loggedInUserId: loggedInUser?.id, targetUserId });

    // Filter simulations based on ownership
    const filteredSimulations = targetUser.simulations.filter(sim => {
      if (isOwnProfile) {
        // Show all simulations (active + completed)
        return sim.status === "active" || sim.status === "completed";
      } else {
        // Show only completed simulations
        return sim.status === "completed";
      }
    });

    // Format simulations
    const formattedSimulations = filteredSimulations.map(sim => {
      const briefMessage = sim.messages[0];
      const scenarioTitle =
        sim.scenarioTitle ||
        (briefMessage
          ? briefMessage.content.split("\n")[0].replace(/^#\s*/, "").substring(0, 100)
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
        messageCount: sim._count.messages
      };
    });

    // Format user data
    const nameParts = targetUser.name?.split(" ") || [];
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    // Calculate stats
    const stats = {
      totalSimulations: filteredSimulations.length,
      completedSimulations: filteredSimulations.filter(s => s.status === "completed").length,
      activeSimulations: filteredSimulations.filter(s => s.status === "active").length
    };

    logger.info("User details fetched successfully", {
      targetUserId,
      isOwnProfile,
      simulationsCount: formattedSimulations.length,
      stats
    });

    logComplete();

    return NextResponse.json({
      success: true,
      user: {
        id: targetUser.id,
        firstName,
        lastName,
        fullName: targetUser.name || "Utente senza nome",
        email: isOwnProfile ? targetUser.email : null,
        createdAt: targetUser.createdAt
      },
      simulations: formattedSimulations,
      isOwnProfile,
      stats
    });
  } catch (error) {
    logger.error("Error fetching user details", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user details",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
