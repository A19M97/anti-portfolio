import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { UserCard } from "@/components/users/user-card"
import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
  const { userId } = await auth()
  const user = await currentUser()
  const t = await getTranslations('Dashboard')

  if (!userId) {
    redirect("/sign-in")
  }

  // Fetch all users for the users grid
  const allUsers = await db.user.findMany({
    select: {
      id: true,
      clerkId: true,
      name: true,
      email: true,
      _count: {
        select: {
          simulations: {
            where: { status: "completed" }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  // Format users
  const formattedUsers = allUsers.map(user => {
    const nameParts = user.name?.split(" ") || [];
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return {
      id: user.id,
      firstName,
      lastName,
      fullName: user.name || t('namelessUser'),
      completedSimulationsCount: user._count.simulations
    };
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {t('welcomeBack', { name: user?.firstName || 'User' })}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {user?.emailAddresses[0].emailAddress}
        </p>
      </div>

      {/* Users Grid */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold">{t('allUsers')}</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('exploreProfiles')}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {formattedUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>

        {formattedUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('noUsers')}
          </div>
        )}
      </div>
    </div>
  )
}
