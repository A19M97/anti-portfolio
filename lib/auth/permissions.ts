import { db } from "@/lib/db";

const ADMIN_EMAIL = "andrea.mugnai97@gmail.com";

/**
 * Check if a user is an admin or the specific authorized user
 * @param email - User's email address
 * @returns Promise<boolean>
 */
export async function isAdmin(email: string): Promise<boolean> {
  // Check if user is the specific authorized user
  if (email === ADMIN_EMAIL) {
    return true;
  }

  // Check if user has admin role in database
  const user = await db.user.findUnique({
    where: { email },
    select: { role: true },
  });

  return user?.role === "admin";
}

/**
 * Check if a user is an admin by their clerk ID
 * @param clerkId - User's Clerk ID
 * @returns Promise<boolean>
 */
export async function isAdminByClerkId(clerkId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { clerkId },
    select: { email: true, role: true },
  });

  if (!user) {
    return false;
  }

  return user.email === ADMIN_EMAIL || user.role === "admin";
}
