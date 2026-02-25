import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle, signUpWithEmail, signInWithEmail, getGoogleRedirectResult, onAuthChange, linkPasswordToGoogleAccount } from '../services/auth'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../services/firebase'

export default function OnboardAuth(){
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem('calorieWise.rememberMe') !== '0'
    } catch (e) {
      return true
    }
  })
  const [pendingGooglePasswordSetup, setPendingGooglePasswordSetup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resetSent, setResetSent] = useState(false)

  const saveRememberedAuth = (resolvedEmail, shouldRemember) => {
    try {
      localStorage.setItem('calorieWise.rememberMe', shouldRemember ? '1' : '0')
      if (shouldRemember && resolvedEmail.trim()) {
        localStorage.setItem('calorieWise.rememberedEmail', resolvedEmail.trim())
      } else {
        localStorage.removeItem('calorieWise.rememberedEmail')
      }
    } catch (e) {}
  }

  const hasPasswordProvider = (user) => {
    return Boolean(user?.providerData?.some((provider) => provider?.providerId === 'password'))
  }

  const hasGoogleProvider = (user) => {
    return Boolean(user?.providerData?.some((provider) => provider?.providerId === 'google.com'))
  }

  const handleUserAfterAuth = (user) => {
    if (!user) return
    if (hasGoogleProvider(user) && !hasPasswordProvider(user)) {
      setPendingGooglePasswordSetup(true)
      setMode('login')
      setEmail(user.email || '')
      setPassword('')
      setConfirmPassword('')
      setError(null)
      return
    }
    navigate('/onboard', { state: { fromAuth: true } })
  }

  useEffect(() => {
    try {
      const rememberedEmail = localStorage.getItem('calorieWise.rememberedEmail') || ''
      if (rememberedEmail) {
        setEmail(rememberedEmail)
      }
    } catch (e) {}
  }, [])

  const handleForgotPassword = async () => {
    setError(null)
    setResetSent(false)
    if (!email.trim()) {
      setError('Enter your email above to reset password.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
    } catch (e) {
      setError(e.message || 'Failed to send reset email.')
    }
  }

  useEffect(() => {
    let cancelled = false
    const checkRedirect = async () => {
      setLoading(true)
      try {
        const user = await getGoogleRedirectResult()
        if (!cancelled && user) {
          console.log('[OnboardAuth] User signed in with Google (redirect):', user.email)
          handleUserAfterAuth(user)
          return
        }
        if (!cancelled && auth.currentUser) {
          console.log('[OnboardAuth] User already signed in:', auth.currentUser.email)
          handleUserAfterAuth(auth.currentUser)
        }
      } catch (e) {
        if (!cancelled) {
          console.error('[OnboardAuth] Google redirect failed:', e.message)
          setError(e.message || 'Failed to complete Google sign-in. Please try again.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    checkRedirect()
    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        console.log('[OnboardAuth] Auth state ready:', user.email)
        handleUserAfterAuth(user)
      }
    })
    return () => unsubscribe()
  }, [navigate])

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    setResetSent(false)
    try{
      const result = await signInWithGoogle(rememberMe)
      if (result?.user) {
        console.log('[OnboardAuth] User signed in with Google:', result.user.email)
        saveRememberedAuth(result.user.email || email, rememberMe)
        handleUserAfterAuth(result.user)
      } else if (result?.redirect) {
        try{ sessionStorage.setItem('calorieWise.pendingGoogleRedirect','1') }catch(e){}
      }
    }catch(e){
      console.error('[OnboardAuth] Google sign-in failed:', e.message)
      setError(e.message || 'Failed to sign in with Google. Please try again.')
    }finally{
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setError(null)
    setResetSent(false)

    if (!email.trim()) {
      setError('Please enter your email')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email')
      return
    }

    if (!password.trim()) {
      setError('Please enter a password')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    const shouldValidateConfirm = mode === 'signup' || pendingGooglePasswordSetup

    if (shouldValidateConfirm) {
      if (!confirmPassword) {
        setError('Please confirm your password')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }

    setLoading(true)
    try{
      const normalizedEmail = email.trim().toLowerCase()

      if (pendingGooglePasswordSetup) {
        const user = await linkPasswordToGoogleAccount(password, normalizedEmail)
        console.log('[OnboardAuth] Password linked for Google user:', user?.email)
        saveRememberedAuth(normalizedEmail, rememberMe)
        setPendingGooglePasswordSetup(false)
      } else {
        if (mode === 'signup') {
          const user = await signUpWithEmail(normalizedEmail, password, rememberMe)
          console.log('[OnboardAuth] User signed up:', user.email)
        } else {
          const user = await signInWithEmail(normalizedEmail, password, rememberMe)
          console.log('[OnboardAuth] User signed in:', user.email)
        }
        saveRememberedAuth(normalizedEmail, rememberMe)
      }
      navigate('/onboard', { state: { fromAuth: true } })
    }catch(e){
      console.error('[OnboardAuth] Auth failed:', e.message)
      const code = e?.code || ''
      if (code === 'auth/email-already-in-use') {
        setError('Email already registered. Try logging in.')
      } else if (code === 'auth/user-not-found') {
        setError('Email not found. Please sign up.')
      } else if (code === 'auth/wrong-password') {
        setError('Incorrect password')
      } else if (code === 'auth/provider-already-linked') {
        setError('This Google account already has a password. Please log in with your email and password.')
      } else if (code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') {
        setError('Invalid email or password. If you used Google to sign up, use Google sign-in or reset your password.')
      } else {
        setError(e.message || `Failed to ${mode === 'signup' ? 'sign up' : 'sign in'}. Please try again.`)
      }
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo & Brand */}
        <div className="auth-header">
          <img src="/assets/Picsart_26-01-22_22-42-53-930.png" alt="Calorie Wise" className="auth-logo"/>
          <h1 className="auth-title">Calorie Wise</h1>
        </div>

        {/* Tagline */}
        <p className="auth-tagline">
          {pendingGooglePasswordSetup ? 'Add a password to your Google account for easier login' : 'Track calories, achieve goals'}
        </p>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="auth-form" autoComplete="on">
          <div className="form-group">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || pendingGooglePasswordSetup}
              className="auth-input"
              name="email"
              autoComplete="username email"
            />
          </div>

          <div className="form-group">
            <div className="auth-input-row">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={pendingGooglePasswordSetup ? 'Create password' : 'Password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="auth-input"
                name="password"
                autoComplete={mode === 'signup' || pendingGooglePasswordSetup ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className="auth-input-action"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.76-1.8 1.98-3.43 3.44-4.76"/>
                    <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83"/>
                    <path d="M9.88 5.09A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a11.14 11.14 0 0 1-1.67 2.68"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {(mode === 'signup' || pendingGooglePasswordSetup) && (
            <div className="form-group">
              <div className="auth-input-row">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="auth-input"
                  name="confirmPassword"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="auth-input-action"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  title={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.76-1.8 1.98-3.43 3.44-4.76"/>
                      <path d="M10.58 10.58a2 2 0 1 0 2.83 2.83"/>
                      <path d="M9.88 5.09A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a11.14 11.14 0 0 1-1.67 2.68"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          <label className="auth-checkbox-row">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
            />
            <span>Remember me on this device</span>
          </label>


          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}
          {resetSent && (
            <div className="auth-success" style={{color:'green',marginTop:8}}>
              Password reset email sent! Check your inbox.
            </div>
          )}


          <button
            type="submit"
            disabled={loading}
            className="auth-btn-primary"
          >
            {loading
              ? pendingGooglePasswordSetup
                ? 'Adding password...'
                : mode === 'signup'
                  ? 'Signing up...'
                  : 'Signing in...'
              : pendingGooglePasswordSetup
                ? 'Add Password'
                : mode === 'signup'
                  ? 'Sign Up'
                  : 'Log In'}
          </button>

          {mode === 'login' && !pendingGooglePasswordSetup && (
            <button
              type="button"
              className="auth-btn-secondary"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              Forgot Password?
            </button>
          )}

          {pendingGooglePasswordSetup && (
            <button
              type="button"
              className="auth-btn-secondary"
              onClick={() => navigate('/onboard', { state: { fromAuth: true } })}
              disabled={loading}
            >
              Skip for now
            </button>
          )}
        </form>

        {/* Divider */}
        {!pendingGooglePasswordSetup && (
          <div className="auth-divider">
            <span>or</span>
          </div>
        )}

        {/* Google Sign-In */}
        {!pendingGooglePasswordSetup && (
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="auth-btn-google"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
            </svg>
            Continue with Google
          </button>
        )}

        {/* Toggle Mode */}
        {!pendingGooglePasswordSetup && (
          <div className="auth-toggle">
            {mode === 'login' ? (
              <>
                <span className="auth-toggle-text">Don't have an account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup')
                    setError(null)
                    setConfirmPassword('')
                  }}
                  className="auth-toggle-btn"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                <span className="auth-toggle-text">Already have an account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login')
                    setError(null)
                    setConfirmPassword('')
                  }}
                  className="auth-toggle-btn"
                >
                  Log in
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

