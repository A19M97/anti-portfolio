import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Shield, Database, Zap } from "lucide-react"
import { getTranslations } from 'next-intl/server'
import { LanguageSwitcher } from "@/components/language-switcher"

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'HomePage' });

  return {
    title: t('appName'),
    description: t('description')
  };
}

export default async function HomePage() {
  const { userId } = await auth()
  const t = await getTranslations('HomePage')
  const tFeatures = await getTranslations('Features')

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold">{t('appName')}</span>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {userId ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">{t('dashboard')}</Button>
                </Link>
              </>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost">{t('signIn')}</Button>
                </Link>
                <Link href="/sign-up">
                  <Button>{t('signUp')}</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            {t('title')}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            {t('description')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            {userId ? (
              <Link href="/dashboard">
                <Button size="lg" className="gap-2">
                  {t('goToDashboard')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <Link href="/sign-up">
                <Button size="lg" className="gap-2">
                  {t('startBuilding')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-blue-600 mb-2" />
              <CardTitle>{tFeatures('authentication.title')}</CardTitle>
              <CardDescription>
                {tFeatures('authentication.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>✓ {tFeatures('authentication.features.emailLinks')}</li>
                <li>✓ {tFeatures('authentication.features.protectedRoutes')}</li>
                <li>✓ {tFeatures('authentication.features.webhooks')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Database className="h-10 w-10 text-green-600 mb-2" />
              <CardTitle>{tFeatures('database.title')}</CardTitle>
              <CardDescription>
                {tFeatures('database.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>✓ {tFeatures('database.features.docker')}</li>
                <li>✓ {tFeatures('database.features.migrations')}</li>
                <li>✓ {tFeatures('database.features.typesSafe')}</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-purple-600 mb-2" />
              <CardTitle>{tFeatures('ui.title')}</CardTitle>
              <CardDescription>
                {tFeatures('ui.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>✓ {tFeatures('ui.features.accessible')}</li>
                <li>✓ {tFeatures('ui.features.validation')}</li>
                <li>✓ {tFeatures('ui.features.responsive')}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-32 border-t">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {t('footer')}
          </p>
        </div>
      </footer>
    </div>
  )
}
