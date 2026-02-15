import { 
  setDoc, 
  getDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore'
import { db } from './firebase'

/**
 * Save all user data from localStorage to Firestore under a "userDataSnapshot" document.
 * Called after Google Sign-In to back up all local data.
 */
export const saveUserDataToFirestore = async (userId) => {
  try {
    // Collect all localStorage data
    const userData = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('calorieWise.')) {
        userData[key] = localStorage.getItem(key)
      }
    }

    // Save to Firestore under /users/{userId}/data
    await setDoc(doc(db, 'users', userId, 'data', 'snapshot'), {
      ...userData,
      lastSync: serverTimestamp()
    })
    console.log('[Firestore] User data saved successfully')
    return true
  } catch (error) {
    console.error('[Firestore] Failed to save user data:', error.message)
    throw error
  }
}

/**
 * Load all user data from Firestore and restore to localStorage.
 * If offline, gracefully return false without throwing.
 */
export const loadUserDataFromFirestore = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId, 'data', 'snapshot')
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      const data = docSnap.data()
      // Restore all data to localStorage (skip serverTimestamp)
      Object.keys(data).forEach(key => {
        if (key !== 'lastSync' && typeof data[key] === 'string') {
          localStorage.setItem(key, data[key])
        }
      })
      console.log('[Firestore] User data loaded successfully')
      return true
    } else {
      console.log('[Firestore] No saved data found for user')
      return false
    }
  } catch (error) {
    // Gracefully handle offline and other errors
    console.warn('[Firestore] Failed to load user data:', error.message)
    // Don't throw - app continues with local data
    return false
  }
}

/**
 * Optional: Sync data on logout (keep cloud backup).
 * Gracefully handles offline - just skips if not available.
 */
export const syncDataBeforeLogout = async (userId) => {
  try {
    await saveUserDataToFirestore(userId)
    console.log('[Firestore] Data synced before logout')
  } catch (error) {
    console.warn('[Firestore] Sync before logout failed (non-critical, app works offline):', error.message)
    // Don't throw - user can still sign out
  }
}
