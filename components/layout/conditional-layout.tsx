"use client"

import { useAuth, useUser } from "@clerk/nextjs"
import { Sidebar } from "@/components/layout/sidebar"
import { UserSyncProvider } from "@/components/user-sync-provider"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const { userId, isLoaded } = useAuth()
  const { user } = useUser()

  // Mostra layout base mentre carica
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    )
  }

  // Utente autenticato: layout completo con sidebar
  if (userId && user) {
    return (
      <UserSyncProvider>
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
          <Sidebar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </UserSyncProvider>
    )
  }

  // Utente NON autenticato: layout semplice senza sidebar
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="overflow-auto">{children}</main>
    </div>
  )
}
