import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import SplashPage from './pages/SplashPage'
import OnboardAuth from './pages/OnboardAuth'
import Onboard from './pages/Onboard'
import OnboardDetails from './pages/OnboardDetails'
import OnboardWeightGoal from './pages/OnboardWeightGoal'
import Profile from './pages/Profile'
import TrackCalories from './pages/TrackCalories'
import CaloriesBurned from './pages/CaloriesBurned'
import Calendar from './pages/Calendar'
import MealPlanner from './pages/MealPlanner'
import AddRecipe from './pages/AddRecipe'
import Tasks from './pages/Tasks'
import WorkoutManager from './pages/WorkoutManager'
import WorkoutDay from './pages/WorkoutDay'
import ConditionalHome from './ConditionalHome'
import { SyncProvider } from './context/SyncContext'
import '../styles.css'

const THEME_KEY = 'calorieWise.theme'

const applyStoredTheme = () => {
  try {
    const storedTheme = localStorage.getItem(THEME_KEY)
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches || false
    const shouldUseDark = storedTheme ? storedTheme === 'dark' : prefersDark
    document.documentElement.classList.toggle('theme-dark', shouldUseDark)
    document.documentElement.style.colorScheme = shouldUseDark ? 'dark' : 'light'
  } catch (e) {}
}

applyStoredTheme()
window.addEventListener('pageshow', applyStoredTheme)
window.addEventListener('storage', (event) => {
  if (event.key === THEME_KEY) {
    applyStoredTheme()
  }
})

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[PWA] Service worker registration failed:', error)
    })
  })
}

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <SyncProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
        <Route path="/" element={<ConditionalHome/>} />
        <Route path="/splash" element={<SplashPage/>} />
        <Route path="/onboard/auth" element={<OnboardAuth/>} />
        <Route path="/onboard-auth" element={<OnboardAuth/>} />
        <Route path="/onboard" element={<Onboard/>} />
        <Route path="/onboard/details" element={<OnboardDetails/>} />
        <Route path="/onboard/weight" element={<OnboardWeightGoal/>} />
        <Route path="/profile" element={<Profile/>} />
        <Route path="/track" element={<TrackCalories/>} />
        <Route path="/burned" element={<CaloriesBurned/>} />
        <Route path="/calendar" element={<Calendar/>} />
        <Route path="/meal-planner" element={<MealPlanner/>} />
        <Route path="/add-recipe" element={<AddRecipe/>} />
        <Route path="/tasks" element={<Tasks/>} />
        <Route path="/workout-manager" element={<WorkoutManager/>} />
        <Route path="/workout-manager/:day" element={<WorkoutDay/>} />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
    </SyncProvider>
  </React.StrictMode>
)
