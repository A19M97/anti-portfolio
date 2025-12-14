"use client"

import { useAuth, useUser } from "@clerk/nextjs"
import { SocialFeed } from "@/components/feed/social-feed"
import { useTranslations } from 'next-intl'
import { Link } from "@/i18n/routing"
import { Button } from "@/components/ui/button"
import { Plus, LogIn, UserPlus } from "lucide-react"

export default function DashboardPage() {
  const { userId } = useAuth()
  const { user } = useUser()
  const t = useTranslations('Dashboard')

  // Layout per utenti NON autenticati
  if (!userId || !user) {
    return (
      <div className="p-4 md:p-8">
        {/* Header pubblico */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-3">
            Community Anti-Portfolio
          </h1>
          <p className="text-gray-700 dark:text-gray-300 text-lg mb-6">
            Scopri cosa stanno facendo gli altri nella community
          </p>

          {/* CTA per visitatori */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <h2 className="text-xl font-bold mb-2">Unisciti alla community!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Crea il tuo account per iniziare le tue simulazioni e condividere i risultati
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/sign-up">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Registrati
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button size="lg" variant="outline">
                  <LogIn className="h-5 w-5 mr-2" />
                  Accedi
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Social Feed - funziona per tutti */}
        <SocialFeed />
      </div>
    )
  }

  // Layout per utenti autenticati
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {user.firstName?.charAt(0).toUpperCase()}{user.lastName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                {t('welcomeBack', { name: user.firstName || 'User' })}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {user.emailAddresses[0].emailAddress}
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
