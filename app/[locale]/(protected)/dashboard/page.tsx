import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Users, Activity, TrendingUp } from "lucide-react"
import { UserForm } from "@/components/forms/user-form"
import { getTranslations } from 'next-intl/server'

export default async function DashboardPage() {
  const { userId } = await auth()
  const user = await currentUser()
  const t = await getTranslations('Dashboard')

  if (!userId) {
    redirect("/sign-in")
  }

  // Fetch user data from database
  const dbUser = await db.user.findUnique({
    where: { clerkId: userId },
  })

  // Sample stats for demonstration
  const stats = {
    totalItems: 42,
    activeUsers: 128,
    weeklyActivity: 89,
    growthRate: 12.5
  }

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

      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.totalItems')}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
              <p className="text-xs text-muted-foreground">{t('stats.sampleMetric')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.activeUsers')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{t('stats.fromLastMonth')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.weeklyActivity')}</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.weeklyActivity}</div>
              <p className="text-xs text-muted-foreground">{t('stats.fromLastWeek')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('stats.growthRate')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.growthRate}%</div>
              <p className="text-xs text-muted-foreground">{t('stats.growthFromLastMonth')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
            <TabsTrigger value="profile">{t('tabs.profileSettings')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('overview.title')}</CardTitle>
                <CardDescription>
                  {t('overview.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <CalendarDays className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{t('overview.accountCreated')}</p>
                        <p className="text-sm text-gray-500">
                          {dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString('en-US') : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{t('overview.active')}</Badge>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h3 className="font-semibold mb-2">{t('overview.quickActions.title')}</h3>
                    <div className="flex gap-2">
                      <Button size="sm">{t('overview.quickActions.createItem')}</Button>
                      <Button size="sm" variant="outline">{t('overview.quickActions.viewStats')}</Button>
                      <Button size="sm" variant="outline">{t('overview.quickActions.settings')}</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.title')}</CardTitle>
                <CardDescription>
                  {t('profile.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserForm />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
