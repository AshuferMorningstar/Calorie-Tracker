import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import App from './App'

export default function ConditionalHome(){
  // Decide whether to show the splash/onboarding flow or the main app.
  // If the user has previously completed onboarding (persisted in localStorage
  // as `calorieWise.seenEver`) render the app directly. Otherwise, if we arrived
  // from the SplashPage during client navigation, render the app to avoid a loop.
  const location = useLocation()

  try{
    const seenEver = (()=>{ try{ return localStorage.getItem('calorieWise.seenEver') }catch(e){ return null } })()
    console.log('[ConditionalHome] location state:', location && location.state, 'seenEver=', seenEver)

    if(seenEver){
      console.log('[ConditionalHome] user already onboarded — rendering App')
      return <App />
    }

    if(location && location.state && location.state.fromSplash){
      console.log('[ConditionalHome] rendering App (arrived from splash)')
      return <App />
    }
  }catch(e){/* ignore */}

  console.log('[ConditionalHome] redirecting to /splash')
  return <Navigate to="/splash" replace />
}
