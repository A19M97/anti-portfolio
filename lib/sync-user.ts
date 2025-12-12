/**
 * Sincronizza l'utente loggato in Clerk con il database
 * Crea l'utente se non esiste, altrimenti ritorna quello esistente
 */
export async function syncUser() {
    try {
        const response = await fetch('/api/users/sync', {
            method: 'POST',
        })

        if (!response.ok) {
            throw new Error('Failed to sync user')
        }

        const data = await response.json()
        return data
    } catch (error) {
        console.error('Error syncing user:', error)
        throw error
    }
}