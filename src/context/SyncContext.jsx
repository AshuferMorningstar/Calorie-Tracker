import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { onAuthChange } from '../services/auth'
import { loadUserDataFromFirestore, saveUserDataToFirestore } from '../services/firestore'

const SyncContext = createContext({
  currentUser: null,
  isOnline: true,
  syncStatus: 'synced',
  lastSyncAt: null,
  triggerSync: () => {}
})

export const useSyncContext = () => useContext(SyncContext)

export const SyncProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [syncStatus, setSyncStatus] = useState('synced')
  const [lastSyncAt, setLastSyncAt] = useState(() => {
    try{ return localStorage.getItem('calorieWise.lastSyncAt') || null }catch(e){ return null }
  })
  const [authLoading, setAuthLoading] = useState(true)
  const pendingSyncRef = useRef(false)

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
    if (!currentUser || !isOnline) {
      pendingSyncRef.current = true
      return
    }
    pendingSyncRef.current = false
    
    try {
      setSyncStatus('syncing')
      await saveUserDataToFirestore(currentUser.uid)
      setSyncStatus('synced')
      try{
        const nowIso = new Date().toISOString()
        localStorage.setItem('calorieWise.lastSyncAt', nowIso)
        setLastSyncAt(nowIso)
      }catch(e){}
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
          try{
            const nowIso = new Date().toISOString()
            localStorage.setItem('calorieWise.lastSyncAt', nowIso)
            setLastSyncAt(nowIso)
          }catch(e){}
        } catch (e) {
          console.warn('[Sync] Failed to load cloud data:', e.message)
          setSyncStatus('offline')
        }
        if (pendingSyncRef.current && isOnline) {
          triggerSync()
        }
      }
    })
    return () => unsubscribe()
  }, [isOnline])

  return (
    <SyncContext.Provider value={{ currentUser, isOnline, syncStatus, lastSyncAt, triggerSync, authLoading }}>
      {children}
    </SyncContext.Provider>
  )
}
