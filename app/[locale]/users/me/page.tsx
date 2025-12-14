import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function MyProfileRedirect() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    redirect("/sign-in");
  }

  // Get the database user ID from the Clerk ID
  const user = await db.user.findUnique({
    where: { clerkId },
    select: { id: true }
  });

  if (!user) {
    // User doesn't exist in database, redirect to dashboard
    redirect("/dashboard");
  }

  // Redirect to the user's profile page
  redirect(`/users/${user.id}`);
}
