import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()

const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true
}

const isMobileUserAgent = () => {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

const shouldUseRedirect = () => isStandaloneMode() || isMobileUserAgent()

export const signInWithGoogle = async () => {
  try {
    if (shouldUseRedirect()) {
      await signInWithRedirect(auth, googleProvider)
      return { user: null, redirect: true }
    }
    const result = await signInWithPopup(auth, googleProvider)
    return { user: result.user, redirect: false }
  } catch (error) {
    console.error('[Auth] Google sign-in failed:', error.message)
    throw error
  }
}

export const getGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth)
    return result?.user || null
  } catch (error) {
    console.error('[Auth] Google redirect result failed:', error.message)
    throw error
  }
}

export const signUpWithEmail = async (email, password) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    return result.user
  } catch (error) {
    console.error('[Auth] Sign-up failed:', error.message)
    throw error
  }
}

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  } catch (error) {
    console.error('[Auth] Sign-in failed:', error.message)
    throw error
  }
}

export const signOut = async () => {
  try {
    await firebaseSignOut(auth)
  } catch (error) {
    console.error('[Auth] Sign-out failed:', error.message)
    throw error
  }
}

export const getCurrentUser = () => {
  return auth.currentUser
}

export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}
