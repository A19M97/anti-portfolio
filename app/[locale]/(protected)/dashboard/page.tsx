import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { SocialFeed } from "@/components/feed/social-feed"
import { getTranslations } from 'next-intl/server'
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function DashboardPage() {
  const { userId } = await auth()
  const user = await currentUser()
  const t = await getTranslations('Dashboard')

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {user?.firstName?.charAt(0).toUpperCase()}{user?.lastName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {t('welcomeBack', { name: user?.firstName || 'User' })}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {user?.emailAddresses[0].emailAddress}
              </p>
            </div>
          </div>
          <Link href="/onboarding">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
              <Plus className="h-5 w-5 mr-2" />
              Nuova Simulazione
            </Button>
          </Link>
        </div>
        <p className="text-gray-700 dark:text-gray-300 text-lg">
          Scopri cosa stanno facendo gli altri nella community
        </p>
      </div>

      {/* Social Feed */}
      <SocialFeed />
    </div>
  )
}
