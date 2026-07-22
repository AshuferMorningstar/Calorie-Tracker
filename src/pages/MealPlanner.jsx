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
  const [recipeSearch, setRecipeSearch] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  const [saveQuantity, setSaveQuantity] = useState(1)
  const prevTodayRef = useRef(todayISO())
  const todayValue = todayISO()

  const filteredRecipes = savedRecipes.filter((recipe) => {
    const query = recipeSearch.trim().toLowerCase()
    if (!query) return true
    const name = (recipe.recipeName || recipe.name || '').toLowerCase()
    return name.includes(query)
  })
  
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
      const quantity = Math.max(1, Math.min(99, saveQuantity || 1))
      const newItems = []
      for (let q = 0; q < quantity; q++) {
        recipesToAdd.forEach(recipe => {
          newItems.push({
            id: Date.now() + Math.random() + q,
            source: 'mealplanner',
            name: recipe.recipeName || recipe.name,
            amount: recipe.ingredients ? null : recipe.amount,
            kcalPer100g: recipe.ingredients ? null : recipe.kcalPer100g,
            kcalPerUnit: recipe.ingredients ? null : recipe.kcalPerUnit,
            proteinPer100g: recipe.ingredients ? null : recipe.proteinPer100g,
            proteinPerUnit: recipe.ingredients ? null : recipe.proteinPerUnit,
            caloriesPerGram: recipe.ingredients ? null : recipe.caloriesPerGram,
            calories: recipe.totalCalories || recipe.calories || 0,
            protein: recipe.totalProtein || recipe.protein || 0,
            ingredients: recipe.ingredients || null
          })
        })
      }
      // Always read the latest from localStorage to be safe
      let existing = []
      try {
        const raw = localStorage.getItem(key)
        if (raw) existing = JSON.parse(raw)
      } catch (e) {}
      const updated = [...existing, ...newItems]
      try {
        localStorage.setItem(key, JSON.stringify(updated))
        setEntriesForDate(updated)
        setSelectedRecipeIds(new Set())
        setSaveQuantity(1)
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

    const requestAction = (action) => {
      if (action === 'delete' && selectedRecipeIds.size === 0) return
      if (action === 'edit' && selectedRecipeIds.size !== 1) return
      setPendingAction(action)
    }

    const cancelPendingAction = () => {
      setPendingAction(null)
    }

    const confirmPendingAction = () => {
      if (!pendingAction) return
      if (pendingAction === 'edit') handleEditSelectedRecipe()
      if (pendingAction === 'delete') handleDeleteSelectedRecipes()
      setPendingAction(null)
    }

    const pendingActionText = (() => {
      const count = selectedRecipeIds.size
      if (pendingAction === 'edit') {
        return {
          title: 'Edit selected recipe?',
          note: 'This will open the recipe editor.'
        }
      }
      if (pendingAction === 'delete') {
        return {
          title: `Delete ${count} ${count === 1 ? 'recipe' : 'recipes'}?`,
          note: 'This will remove the selected recipes from your saved list.'
        }
      }
      return null
    })()
  
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
          <div className="card edge-blue-light" style={{ marginBottom: 16, padding: 12 }}>
            <label htmlFor="mealplanner-date" style={{ display: 'block', fontSize: 14, marginBottom: 8, fontWeight: 500 }}>
              Select Date
            </label>
            <input
              id="mealplanner-date"
              name="selectedDate"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const next = e.target.value
                setSelectedDate(next && next <= todayValue ? next : todayValue)
              }}
              max={todayValue}
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
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              Choose any past or present date to add your created recipe to Track Calories for that day.
            </div>
          </div>
  
          {/* Add Recipe Button */}
          <button
            className="card square-card"
            onClick={() => navigate('/add-recipe')}
            disabled={savedRecipes.length >= MAX_RECIPES}
            style={{
              width: '100%',
              height: 'auto',
              minHeight: 72,
              padding: '12px 16px',
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
            + Create Recipe {savedRecipes.length > 0 && `(${savedRecipes.length}/${MAX_RECIPES})`}
          </button>
  
          {/* Saved Recipes Library - Only show if there are recipes */}
          {savedRecipes.length > 0 && (
            <div>
              <div className="card edge-blue-light" style={{ marginTop: 12, display: 'block', padding: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', marginBottom: 8 }}>Action buttons</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    className="card"
                    onClick={() => setSelectedRecipeIds(new Set())}
                    disabled={selectedRecipeIds.size === 0}
                    style={{
                      flex: '0 0 auto',
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
                  {selectedRecipeIds.size > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        onClick={() => setSaveQuantity(q => Math.max(1, (q || 1) - 1))}
                        style={{
                          width: 28, height: 28, border: '1px solid var(--card-border)', borderRadius: 6,
                          background: 'var(--card-bg)', color: 'var(--text)', cursor: 'pointer', fontSize: 16,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1
                        }}
                        aria-label="Decrease quantity"
                      >−</button>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={saveQuantity}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10)
                          if (!isNaN(v)) setSaveQuantity(Math.max(1, Math.min(99, v)))
                        }}
                        style={{
                          width: 46, height: 28, textAlign: 'center', fontSize: 13, fontWeight: 600,
                          border: '1px solid var(--card-border)', borderRadius: 6,
                          background: 'var(--card-bg)', color: 'var(--text)',
                          MozAppearance: 'textfield', appearance: 'textfield'
                        }}
                        aria-label="Save quantity"
                      />
                      <button
                        onClick={() => setSaveQuantity(q => Math.min(99, (q || 1) + 1))}
                        style={{
                          width: 28, height: 28, border: '1px solid var(--card-border)', borderRadius: 6,
                          background: 'var(--card-bg)', color: 'var(--text)', cursor: 'pointer', fontSize: 16,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1
                        }}
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
                  )}
                  <button
                    className="card"
                    onClick={handleAddSelectedRecipes}
                    disabled={selectedRecipeIds.size === 0}
                    style={{
                      flex: '0 0 auto',
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
                    onClick={() => requestAction('edit')}
                    disabled={selectedRecipeIds.size !== 1}
                    style={{
                      flex: '0 0 auto',
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
                    onClick={() => requestAction('delete')}
                    disabled={selectedRecipeIds.size === 0}
                    style={{
                      flex: '0 0 auto',
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
                  {selectedRecipeIds.size > 0 ? `Use the quantity stepper to save multiple copies. ` : ''}Tap a recipe again to unselect it. Edit works only when exactly one recipe is checked.
                </div>
              </div>

              <div className="card edge-blue-light" style={{ marginTop: 12, display: 'block', padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontWeight: 700 }}>Recipes</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{filteredRecipes.length}/{savedRecipes.length}</div>
                </div>
                <input
                  id="mealplanner-recipe-search"
                  name="mealplannerRecipeSearch"
                  type="text"
                  value={recipeSearch}
                  onChange={(e) => setRecipeSearch(e.target.value)}
                  placeholder="Search recipe"
                  style={{
                    width: '100%',
                    padding: 10,
                    fontSize: 14,
                    border: '1px solid var(--card-border)',
                    borderRadius: 8,
                    background: 'var(--card-bg)',
                    color: 'var(--text)'
                  }}
                />

                <div className="mealplanner-recipes-scroll" style={{ marginTop: 10 }}>
                  {filteredRecipes.length === 0 ? (
                    <div className="card" style={{ color: 'var(--muted)', justifyContent: 'center' }}>
                      No recipes found.
                    </div>
                  ) : (
                    <div className="saved-recipes-wrapper" style={{ width: '100%', display: 'grid', gap: 8 }}>
                      {filteredRecipes.map(recipe => {
                        const isSelected = selectedRecipeIds.has(recipe.id)
                        return (
                          <div
                            key={recipe.id}
                            className="card mealplanner-recipe-card"
                            onClick={() => toggleRecipeSelect(recipe.id)}
                            style={{
                              padding: '10px 12px',
                              display: 'grid',
                              gridTemplateColumns: '1fr auto',
                              columnGap: 10,
                              alignItems: 'center',
                              cursor: 'pointer',
                              background: isSelected ? 'var(--selected-bg)' : 'var(--card-bg)',
                              opacity: isSelected ? 0.95 : 1,
                              border: isSelected ? '1px solid var(--accent1)' : '1px solid var(--card-border)',
                              transition: 'all 0.12s',
                              minWidth: 0,
                              width: '100%'
                            }}
                          >
                            <div className="recipe-text" style={{ display: 'block', minWidth: 0, overflow: 'hidden' }}>
                              <div className="recipe-name" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
                                {recipe.recipeName || recipe.name}
                              </div>
                              <div className="recipe-meta" style={{ fontSize: 11, opacity: 0.75, color: 'var(--muted)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
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
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                              onChange={(e) => {
                                e.stopPropagation()
                                toggleRecipeSelect(recipe.id)
                              }}
                              style={{
                                width: 18,
                                height: 18,
                                cursor: 'pointer',
                                alignSelf: 'center',
                                margin: 0,
                                display: 'block'
                              }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {pendingAction && pendingActionText && (
            <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.32)' }} onClick={cancelPendingAction}></div>
              <div className="card" style={{ zIndex: 1201, maxWidth: 520, width: '92%', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ minWidth: 0, width: '100%' }}>
                  <div style={{ fontWeight: 700 }}>{pendingActionText.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{pendingActionText.note}</div>
                </div>
                {pendingAction === 'save' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>Quantity:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSaveQuantity(q => Math.max(1, (q || 1) - 1)) }}
                        style={{
                          width: 32, height: 32, border: '1px solid var(--card-border)', borderRadius: 6,
                          background: 'var(--card-bg)', color: 'var(--text)', cursor: 'pointer', fontSize: 18,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1
                        }}
                        aria-label="Decrease quantity"
                      >−</button>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={saveQuantity}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10)
                          if (!isNaN(v)) setSaveQuantity(Math.max(1, Math.min(99, v)))
                        }}
                        style={{
                          width: 52, height: 32, textAlign: 'center', fontSize: 14, fontWeight: 600,
                          border: '1px solid var(--card-border)', borderRadius: 6,
                          background: 'var(--card-bg)', color: 'var(--text)',
                          MozAppearance: 'textfield', appearance: 'textfield'
                        }}
                        aria-label="Save quantity"
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); setSaveQuantity(q => Math.min(99, (q || 1) + 1)) }}
                        style={{
                          width: 32, height: 32, border: '1px solid var(--card-border)', borderRadius: 6,
                          background: 'var(--card-bg)', color: 'var(--text)', cursor: 'pointer', fontSize: 18,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1
                        }}
                        aria-label="Increase quantity"
                      >+</button>
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="card" onClick={cancelPendingAction} style={{ padding: '8px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Cancel</button>
                  <button className="card" onClick={confirmPendingAction} style={{ padding: '8px 12px', fontWeight: 600, whiteSpace: 'nowrap' }}>Confirm</button>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}
