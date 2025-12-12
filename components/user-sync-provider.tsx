'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'

/**
 * Componente che sincronizza automaticamente l'utente loggato con il database
 * Inseriscilo nel layout protetto per garantire che ogni utente sia sincronizzato
 */
export function UserSyncProvider({ children }: { children: React.ReactNode }) {
    const { userId, isLoaded } = useAuth()

    useEffect(() => {
        async function syncUser() {
            if (!isLoaded || !userId) return

            try {
                const response = await fetch('/api/users/sync', {
                    method: 'POST',
                })

                if (!response.ok) {
                    const text = await response.text()
                    console.error('Failed to sync user:', response.status, response.statusText, text)
                    return
                }

                const data = await response.json()

                if (data.created) {
                    console.log('User created in database:', data.user)
                }
            } catch (error) {
                console.error('Error syncing user:', error)
            }
        }

        syncUser()
    }, [userId, isLoaded])

    return <>{children}</>
}