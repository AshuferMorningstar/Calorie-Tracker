import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle, signUpWithEmail, signInWithEmail } from '../services/auth'

export default function OnboardAuth(){
  const navigate = useNavigate()
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    try{
      const user = await signInWithGoogle()
      console.log('[OnboardAuth] User signed in with Google:', user.email)
      navigate('/onboard', { state: { fromAuth: true } })
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

    if (mode === 'signup') {
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
      if (mode === 'signup') {
        const user = await signUpWithEmail(email, password)
        console.log('[OnboardAuth] User signed up:', user.email)
      } else {
        const user = await signInWithEmail(email, password)
        console.log('[OnboardAuth] User signed in:', user.email)
      }
      navigate('/onboard', { state: { fromAuth: true } })
    }catch(e){
      console.error('[OnboardAuth] Auth failed:', e.message)
      if (e.message.includes('email-already-in-use')) {
        setError('Email already registered. Try logging in.')
      } else if (e.message.includes('user-not-found')) {
        setError('Email not found. Please sign up.')
      } else if (e.message.includes('wrong-password')) {
        setError('Incorrect password')
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
        <p className="auth-tagline">Track calories, achieve goals</p>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="auth-form">
          <div className="form-group">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="auth-input"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="auth-input"
            />
          </div>

          {mode === 'signup' && (
            <div className="form-group">
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="auth-input"
              />
            </div>
          )}

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-btn-primary"
          >
            {loading ? (mode === 'signup' ? 'Signing up...' : 'Signing in...') : (mode === 'signup' ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* Google Sign-In */}
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

        {/* Toggle Mode */}
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
      </div>
    </div>
  )
}

