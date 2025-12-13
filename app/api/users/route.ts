import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loggers } from "@/lib/logger";

const logger = loggers.api;

export async function GET() {
  const logComplete = logger.startOperation("GET /api/users");

  try {
    logger.info("Fetching all users");

    // Check authentication
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      logger.warn("Unauthorized GET request - no clerkId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    logger.debug("User authenticated", { clerkId });

    // Fetch all users with basic info
    const users = await db.user.findMany({
      select: {
        id: true,
        clerkId: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            simulations: {
              where: {
                status: "completed"
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Format response: split name into firstName/lastName
    const formattedUsers = users.map(user => {
      const nameParts = user.name?.split(" ") || [];
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      return {
        id: user.id,
        clerkId: user.clerkId,
        firstName,
        lastName,
        fullName: user.name || "Utente senza nome",
        email: user.email,
        completedSimulationsCount: user._count.simulations,
        createdAt: user.createdAt
      };
    });

    logger.info("Users fetched successfully", {
      usersCount: formattedUsers.length,
    });

    logComplete();

    return NextResponse.json({
      success: true,
      users: formattedUsers
    });
  } catch (error) {
    logger.error("Error fetching users", error);
    return NextResponse.json(
      {
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
