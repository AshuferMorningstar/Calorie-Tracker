import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import App from './App'

export default function ConditionalHome(){
  // Show the splash page whenever the page is loaded directly (refresh or fresh open).
  // If the location.state.fromSplash flag is present (i.e., we arrived via the SplashPage
  // client navigation), render the app without redirect to avoid a loop.
  const location = useLocation()

  try{
    console.log('[ConditionalHome] location state:', location && location.state)
    if(location && location.state && location.state.fromSplash){
      console.log('[ConditionalHome] rendering App (arrived from splash)')
      return <App />
    }
  }catch(e){/* ignore */}

  console.log('[ConditionalHome] redirecting to /splash')
  return <Navigate to="/splash" replace />
}
