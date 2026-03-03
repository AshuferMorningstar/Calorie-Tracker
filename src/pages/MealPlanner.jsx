import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSyncContext } from '../context/SyncContext'

const MAX_RECIPES = 30

export default function MealPlanner() {
  const navigate = useNavigate()
  const { triggerSync } = useSyncContext()
  const todayISO = () => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const [selectedDate, setSelectedDate] = useState(() => todayISO())
  const [savedRecipes, setSavedRecipes] = useState([])
  const [entriesForDate, setEntriesForDate] = useState([])
  const [selectedRecipeIds, setSelectedRecipeIds] = useState(new Set())
  const prevTodayRef = useRef(todayISO())
  
  // Load saved recipes
  useEffect(() => {
    loadRecipes()
    
    // Reload recipes when window gains focus (user returns to tab)
    const handleFocus = () => loadRecipes()
    window.addEventListener('focus', handleFocus)
    
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Load added recipes for selected date
  useEffect(() => {
    loadAddedRecipesForDate()
  }, [selectedDate])

  // Auto-advance date when the day changes if user is on "today"
  useEffect(() => {
    let timer = null
    const schedule = () => {
      const now = new Date()
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      const ms = Math.max(1000, next.getTime() - now.getTime() + 50)
      timer = setTimeout(() => {
        try {
          const newToday = todayISO()
          if (selectedDate === prevTodayRef.current) {
            setSelectedDate(newToday)
          }
          prevTodayRef.current = newToday
        } catch (e) {}
        schedule()
      }, ms)
    }
    prevTodayRef.current = todayISO()
    schedule()
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [selectedDate])

  const loadRecipes = () => {
    try {
      const stored = localStorage.getItem('calorieWise.recipes')
      if (stored) {
        setSavedRecipes(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load recipes:', e)
    }
  }

    const loadAddedRecipesForDate = () => {
      try {
        const key = `calorieWise.entries.${selectedDate}`
        const stored = localStorage.getItem(key)
        if (stored) {
          const entries = JSON.parse(stored)
          setEntriesForDate(entries)
        } else {
          setEntriesForDate([])
        }
      } catch (e) {
        console.error('Failed to load entries:', e)
      }
    }
  
    const saveRecipes = (recipes) => {
      try {
        localStorage.setItem('calorieWise.recipes', JSON.stringify(recipes))
        setSavedRecipes(recipes)
        triggerSync()
      } catch (e) {
        console.error('Failed to save recipes:', e)
      }
    }
  
    const handleDeleteSelectedRecipes = () => {
      if (selectedRecipeIds.size === 0) return
      if (!confirm(`Delete ${selectedRecipeIds.size} selected ${selectedRecipeIds.size === 1 ? 'recipe' : 'recipes'}?`)) return
      const updated = savedRecipes.filter(r => !selectedRecipeIds.has(r.id))
      saveRecipes(updated)
      setSelectedRecipeIds(new Set())
    }
  
    const toggleRecipeSelect = (recipeId) => {
      setSelectedRecipeIds(prev => {
        const next = new Set(prev)
        if (next.has(recipeId)) next.delete(recipeId)
        else next.add(recipeId)
        return next
      })
    }
  
    const handleAddSelectedRecipes = () => {
      if (selectedRecipeIds.size === 0) return
      const key = `calorieWise.entries.${selectedDate}`
      const recipesToAdd = savedRecipes.filter(r => selectedRecipeIds.has(r.id))
      const newItems = recipesToAdd.map(recipe => ({
        id: Date.now() + Math.random(),
        source: 'mealplanner',
        name: recipe.recipeName || recipe.name,
        amount: recipe.ingredients ? null : recipe.amount,
        kcalPer100g: recipe.ingredients ? null : recipe.kcalPer100g,
        kcalPerUnit: recipe.ingredients ? null : recipe.kcalPerUnit,
        proteinPer100g: recipe.ingredients ? null : recipe.proteinPer100g,
        proteinPerUnit: recipe.ingredients ? null : recipe.proteinPerUnit,
        caloriesPerGram: recipe.ingredients ? null : recipe.caloriesPerGram,
        calories: recipe.totalCalories || recipe.calories,
        protein: recipe.totalProtein || recipe.protein,
        ingredients: recipe.ingredients || null
      }))
      const updated = [...entriesForDate, ...newItems]
      try {
        localStorage.setItem(key, JSON.stringify(updated))
        setEntriesForDate(updated)
        setSelectedRecipeIds(new Set())
        triggerSync()
        window.dispatchEvent(new Event('calorieWise.entriesChanged'))
      } catch (e) {
        console.error('Failed to add recipes to date:', e)
      }
    }

    const handleEditSelectedRecipe = () => {
      if (selectedRecipeIds.size !== 1) return
      const selectedId = [...selectedRecipeIds][0]
      const recipe = savedRecipes.find(r => r.id === selectedId)
      if (!recipe) return
      navigate('/add-recipe', { state: { recipe } })
    }
  
    const handleBack = () => {
      try {
        if (window.history && window.history.length > 1) {
          navigate(-1)
          return
        }
      } catch (e) {}
      navigate('/', { state: { fromSplash: true } })
    }
  
    return (
      <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button className="icon-btn" onClick={handleBack} style={{ fontSize: 20, lineHeight: 1 }}>←</button>
          <h2 style={{ margin: 0 }}>Meal Planner</h2>
        </div>
  
        <div style={{ paddingBottom: 80 }}>
          {/* Date Selector */}
          <div className="card" style={{ marginBottom: 16, padding: 12 }}>
            <label htmlFor="mealplanner-date" style={{ display: 'block', fontSize: 14, marginBottom: 8, fontWeight: 500 }}>
              Select Date
            </label>
            <input
              id="mealplanner-date"
              name="selectedDate"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                width: '100%',
                padding: 10,
                fontSize: 14,
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: 'var(--card-bg)',
                color: 'var(--text)'
              }}
            />
          </div>
  
          {/* Add Recipe Button */}
          <button
            className="card square-card"
            onClick={() => navigate('/add-recipe')}
            disabled={savedRecipes.length >= MAX_RECIPES}
            style={{
              width: '100%',
              padding: 20,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 16,
              fontWeight: 500,
              cursor: savedRecipes.length >= MAX_RECIPES ? 'not-allowed' : 'pointer',
              opacity: savedRecipes.length >= MAX_RECIPES ? 0.5 : 1
            }}
          >
            + Add Recipe {savedRecipes.length > 0 && `(${savedRecipes.length}/${MAX_RECIPES})`}
          </button>
  
          {/* Saved Recipes Library - Only show if there are recipes */}
          {savedRecipes.length > 0 && (
            <div>
              <div className="card" style={{ marginTop: 12, display: 'block', padding: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>Action buttons</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="card"
                    onClick={() => setSelectedRecipeIds(new Set())}
                    disabled={selectedRecipeIds.size === 0}
                    style={{
                      flex: '1 1 140px',
                      padding: '7px 10px',
                      justifyContent: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: selectedRecipeIds.size === 0 ? 'not-allowed' : 'pointer',
                      opacity: selectedRecipeIds.size === 0 ? 0.6 : 1
                    }}
                  >
                    Clear
                  </button>
                  <button
                    className="card"
                    onClick={handleAddSelectedRecipes}
                    disabled={selectedRecipeIds.size === 0}
                    style={{
                      flex: '1 1 140px',
                      padding: '7px 10px',
                      justifyContent: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: selectedRecipeIds.size === 0 ? 'not-allowed' : 'pointer',
                      opacity: selectedRecipeIds.size === 0 ? 0.6 : 1
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="card"
                    onClick={handleEditSelectedRecipe}
                    disabled={selectedRecipeIds.size !== 1}
                    style={{
                      flex: '1 1 140px',
                      padding: '7px 10px',
                      justifyContent: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: selectedRecipeIds.size !== 1 ? 'not-allowed' : 'pointer',
                      opacity: selectedRecipeIds.size !== 1 ? 0.6 : 1
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="card"
                    onClick={handleDeleteSelectedRecipes}
                    disabled={selectedRecipeIds.size === 0}
                    style={{
                      flex: '1 1 140px',
                      padding: '7px 10px',
                      justifyContent: 'center',
                      gap: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: selectedRecipeIds.size === 0 ? 'not-allowed' : 'pointer',
                      opacity: selectedRecipeIds.size === 0 ? 0.6 : 1
                    }}
                  >
                    Delete
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.35, marginTop: 8 }}>
                  Tap a recipe again to unselect it. Edit works only when exactly one recipe is checked.
                </div>
              </div>

              <div className="saved-recipes-wrapper" style={{ width: '100%', marginTop: 12 }}>
                {savedRecipes.map(recipe => {
                  const isSelected = selectedRecipeIds.has(recipe.id)
                  return (
                    <div
                      key={recipe.id}
                      className="card mealplanner-recipe-card"
                      onClick={() => toggleRecipeSelect(recipe.id)}
                      style={{
                        padding: '6px 8px',
                        display: 'flex',
                        gap: 6,
                        alignItems: 'center',
                        flexWrap: 'nowrap',
                        cursor: 'pointer',
                        background: isSelected ? 'var(--accent1)' : 'var(--card-bg)',
                        opacity: isSelected ? 0.9 : 1,
                        border: isSelected ? '2px solid var(--accent1)' : '1px solid var(--border)',
                        transition: 'all 0.12s',
                        minWidth: 0,
                        flex: '0 1 auto'
                      }}
                    >
                      <div className="recipe-text" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
                        <div className="recipe-name" style={{ fontSize: 13, fontWeight: 500, color: isSelected ? 'white' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0, maxWidth: '120px', flex: '0 1 auto' }}>
                          {recipe.recipeName || recipe.name}
                        </div>
                        <div className="recipe-meta" style={{ fontSize: 11, opacity: 0.7, color: isSelected ? 'rgba(255,255,255,0.7)' : 'inherit', whiteSpace: 'nowrap', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', flex: '0 0 auto', maxWidth: '140px' }}>
                          • {recipe.totalCalories || recipe.calories} kcal
                          {(recipe.totalProtein ?? recipe.protein) !== null && ` • ${recipe.totalProtein ?? recipe.protein}g`}
                        </div>
                      </div>
                      <input
                        id={`mealplanner-recipe-select-${recipe.id}`}
                        name={`mealplannerRecipeSelect-${recipe.id}`}
                        aria-label={`Select recipe ${recipe.recipeName || recipe.name}`}
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation()
                          toggleRecipeSelect(recipe.id)
                        }}
                        style={{
                          width: 16,
                          height: 16,
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
