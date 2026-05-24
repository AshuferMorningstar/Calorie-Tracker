import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential
} from 'firebase/auth'
import { auth } from './firebase'

const googleProvider = new GoogleAuthProvider()

const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)')?.matches || window.navigator?.standalone === true
}

const shouldUseRedirect = () => isStandaloneMode()

// Persist auth state locally so users stay signed in across reloads.
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('[Auth] Failed to set persistence:', error.message)
})

export const setAuthPersistence = async (rememberMe = true) => {
  const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence
  await setPersistence(auth, persistence)
}

export const signInWithGoogle = async (rememberMe = true) => {
  try {
    await setAuthPersistence(rememberMe)
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

export const signUpWithEmail = async (email, password, rememberMe = true) => {
  try {
    await setAuthPersistence(rememberMe)
    const result = await createUserWithEmailAndPassword(auth, email, password)
    return result.user
  } catch (error) {
    console.error('[Auth] Sign-up failed:', error.message)
    throw error
  }
}

export const signInWithEmail = async (email, password, rememberMe = true) => {
  try {
    await setAuthPersistence(rememberMe)
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
  } catch (error) {
    console.error('[Auth] Sign-in failed:', error.message)
    throw error
  }
}

export const signInAsGuest = async (rememberMe = true) => {
  try {
    await setAuthPersistence(rememberMe)
    const result = await signInAnonymously(auth)
    return result.user
  } catch (error) {
    console.error('[Auth] Guest sign-in failed:', error.message)
    throw error
  }
}

export const linkPasswordToGoogleAccount = async (password, email) => {
  try {
    const user = auth.currentUser
    if (!user) {
      throw new Error('Please sign in with Google first.')
    }

    const resolvedEmail = (email || user.email || '').trim().toLowerCase()
    if (!resolvedEmail) {
      throw new Error('No email found for this Google account.')
    }

    const emailCredential = EmailAuthProvider.credential(resolvedEmail, password)
    await linkWithCredential(user, emailCredential)
    return user
  } catch (error) {
    if (error.code === 'auth/provider-already-linked') {
      return auth.currentUser
    }
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
