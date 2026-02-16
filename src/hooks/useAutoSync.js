import { useEffect, useRef, useCallback } from 'react'
import { saveUserDataToFirestore } from '../services/firestore'

/**
 * Auto-sync hook that debounces sync operations to avoid excessive writes
 * Returns a sync function that can be called after any data change
 */
export const useAutoSync = (currentUser, isOnline) => {
  const syncTimerRef = useRef(null)
  const pendingSyncRef = useRef(false)

  const triggerSync = useCallback(() => {
    if (!currentUser || !isOnline) {
      return
    }

    // Mark that we have a pending sync
    pendingSyncRef.current = true

    // Clear any existing timer
    if (syncTimerRef.current) {
      clearTimeout(syncTimerRef.current)
    }

    // Debounce sync by 2 seconds - if user makes multiple changes quickly,
    // we only sync once after they stop
    syncTimerRef.current = setTimeout(async () => {
      if (pendingSyncRef.current && currentUser && isOnline) {
        try {
          console.log('[AutoSync] Syncing data to cloud...')
          await saveUserDataToFirestore(currentUser.uid)
          console.log('[AutoSync] Sync complete')
          pendingSyncRef.current = false
        } catch (e) {
          console.warn('[AutoSync] Sync failed:', e.message)
          // Retry after 10 seconds if failed
          setTimeout(() => {
            if (pendingSyncRef.current) {
              triggerSync()
            }
          }, 10000)
        }
      }
    }, 2000)
  }, [currentUser, isOnline])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
      }
    }
  }, [])

  return triggerSync
}
