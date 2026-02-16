import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential
} from 'firebase/auth'
// Helper: Link Google to email/password account if same email
export const linkGoogleToEmailAccount = async (email, password) => {
  try {
    const userCred = await signInWithEmailAndPassword(auth, email, password)
    const googleResult = await signInWithPopup(auth, googleProvider)
    if (userCred.user.email === googleResult.user.email) {
      // Link Google to this email/password account
      await linkWithCredential(userCred.user, GoogleAuthProvider.credentialFromResult(googleResult))
      return userCred.user
    }
    return null
  } catch (error) {
    if (error.code === 'auth/credential-already-in-use') {
      // Already linked
      return auth.currentUser
    }
    throw error
  }
}

// Helper: Link email/password to Google account if same email
export const linkEmailToGoogleAccount = async (email, password) => {
  try {
    const googleResult = await signInWithPopup(auth, googleProvider)
    const credential = EmailAuthProvider.credential(email, password)
    if (googleResult.user.email === email) {
      await linkWithCredential(googleResult.user, credential)
      return googleResult.user
    }
    return null
  } catch (error) {
    if (error.code === 'auth/credential-already-in-use') {
      // Already linked
      return auth.currentUser
    }
    throw error
  }
}
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

// Persist auth state locally so users stay signed in across reloads.
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('[Auth] Failed to set persistence:', error.message)
})

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
