import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import SplashPage from './pages/SplashPage'
import Onboard from './pages/Onboard'
import OnboardDetails from './pages/OnboardDetails'
import ConditionalHome from './ConditionalHome'
import '../styles.css'

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ConditionalHome/>} />
        <Route path="/splash" element={<SplashPage/>} />
        <Route path="/onboard" element={<Onboard/>} />
        <Route path="/onboard/details" element={<OnboardDetails/>} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
