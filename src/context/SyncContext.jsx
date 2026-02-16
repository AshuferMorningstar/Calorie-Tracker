import React, { createContext, useContext, useState, useEffect } from 'react'
import { onAuthChange } from '../services/auth'
import { loadUserDataFromFirestore, saveUserDataToFirestore } from '../services/firestore'

const SyncContext = createContext({
  currentUser: null,
  isOnline: true,
  syncStatus: 'synced',
  triggerSync: () => {}
})

export const useSyncContext = () => useContext(SyncContext)

export const SyncProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [syncStatus, setSyncStatus] = useState('synced')
  const [authLoading, setAuthLoading] = useState(true)

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (currentUser) {
        triggerSync()
      }
    }
    const handleOffline = () => {
      setIsOnline(false)
      setSyncStatus('offline')
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [currentUser])

  // Sync function with debouncing
  const triggerSync = async () => {
    if (!currentUser || !isOnline) return
    
    try {
      setSyncStatus('syncing')
      await saveUserDataToFirestore(currentUser.uid)
      setSyncStatus('synced')
    } catch (e) {
      console.warn('[Sync] Failed:', e.message)
      setSyncStatus('offline')
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setCurrentUser(user)
      setAuthLoading(false)
      if (user) {
        try {
          console.log('[Sync] User signed in, loading data...')
          await loadUserDataFromFirestore(user.uid)
          setSyncStatus('synced')
        } catch (e) {
          console.warn('[Sync] Failed to load cloud data:', e.message)
          setSyncStatus('offline')
        }
      }
    })
    return () => unsubscribe()
  }, [])

  return (
    <SyncContext.Provider value={{ currentUser, isOnline, syncStatus, triggerSync, authLoading }}>
      {children}
    </SyncContext.Provider>
  )
}
