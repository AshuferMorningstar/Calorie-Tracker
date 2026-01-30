import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import App from './App'
import SplashPage from './pages/SplashPage'

export default function ConditionalHome(){
  // Decide whether to show the splash/onboarding flow or the main app.
  // If the user has previously completed onboarding (persisted in localStorage
  // as `calorieWise.seenEver`) render the app directly. Otherwise, if we arrived
  // from the SplashPage during client navigation, render the app to avoid a loop.
  const location = useLocation()

  try{
    const sessionSeen = (()=>{ try{ return sessionStorage.getItem('calorieWise.splashThisSession') }catch(e){ return null } })()
    console.log('[ConditionalHome] location state:', location && location.state, 'sessionSeen=', sessionSeen)

    // If we arrived from the splash route via client navigation, mark this session
    // as having seen the splash and render the app.
    if(location && location.state && location.state.fromSplash){
      try{ sessionStorage.setItem('calorieWise.splashThisSession','1') }catch(e){}
      console.log('[ConditionalHome] rendering App (arrived from splash)')
      return <App />
    }

    // If this browser tab/session has already shown the splash, render the app.
    if(sessionSeen){
      console.log('[ConditionalHome] splash already shown this session — rendering App')
      return <App />
    }
  }catch(e){/* ignore */}

  console.log('[ConditionalHome] showing SplashPage (inline)')
  // Render the splash inline to avoid adding a history entry via Navigate on initial load.
  // This prevents the browser warning about session history items added without user interaction.
  return <SplashPage />
}
