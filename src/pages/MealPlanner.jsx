import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const MAX_RECIPES = 30

export default function MealPlanner() {
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [savedRecipes, setSavedRecipes] = useState([])
  const [addedRecipes, setAddedRecipes] = useState([])
  const [selectedRecipeIds, setSelectedRecipeIds] = useState(new Set())
  
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
          setAddedRecipes(entries)
        } else {
          setAddedRecipes([])
        }
      } catch (e) {
        console.error('Failed to load entries:', e)
      }
    }
  
    const saveRecipes = (recipes) => {
      try {
        localStorage.setItem('calorieWise.recipes', JSON.stringify(recipes))
        setSavedRecipes(recipes)
      } catch (e) {
        console.error('Failed to save recipes:', e)
      }
    }
  
    const handleDeleteRecipe = (recipeId) => {
      if (!confirm('Delete this recipe?')) return
      const updated = savedRecipes.filter(r => r.id !== recipeId)
      saveRecipes(updated)
    }
  
    const handleAddRecipeToDate = (recipe) => {
      const item = {
        id: Date.now(),
        name: recipe.recipeName || recipe.name,
        amount: recipe.ingredients ? null : recipe.amount,
        kcalPer100g: recipe.ingredients ? null : recipe.kcalPer100g,
        kcalPerUnit: recipe.ingredients ? null : recipe.kcalPerUnit,
        proteinPer100g: recipe.ingredients ? null : recipe.proteinPer100g,
        proteinPerUnit: recipe.ingredients ? null : recipe.proteinPerUnit,
        caloriesPerGram: recipe.ingredients ? null : recipe.caloriesPerGram,
        calories: recipe.totalCalories || recipe.calories,
        protein: recipe.totalProtein || recipe.protein,
        ingredients: recipe.ingredients || null,
      }
      const key = `calorieWise.entries.${selectedDate}`
      const updated = [...addedRecipes, item]
      try {
        localStorage.setItem(key, JSON.stringify(updated))
        setAddedRecipes(updated)
        window.dispatchEvent(new Event('calorieWise.entriesChanged'))
      } catch (e) {
        console.error('Failed to add recipe to date:', e)
      }
    }
  
    const handleRemoveFromDate = (itemId) => {
      const key = `calorieWise.entries.${selectedDate}`
      const updated = addedRecipes.filter(item => item.id !== itemId)
      try {
        if (updated.length > 0) localStorage.setItem(key, JSON.stringify(updated))
        else localStorage.removeItem(key)
        setAddedRecipes(updated)
        window.dispatchEvent(new Event('calorieWise.entriesChanged'))
      } catch (e) {
        console.error('Failed to remove recipe:', e)
      }
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
      const key = `calorieWise.entries.${selectedDate}`
      const recipesToAdd = savedRecipes.filter(r => selectedRecipeIds.has(r.id))
      const newItems = recipesToAdd.map(recipe => ({
        id: Date.now() + Math.random(),
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
      const updated = [...addedRecipes, ...newItems]
      try {
        localStorage.setItem(key, JSON.stringify(updated))
        setAddedRecipes(updated)
        setSelectedRecipeIds(new Set())
        window.dispatchEvent(new Event('calorieWise.entriesChanged'))
      } catch (e) {
        console.error('Failed to add recipes to date:', e)
      }
    }
  
    const totalCalories = addedRecipes.reduce((sum, item) => sum + (item.calories || 0), 0)
    const totalProtein = addedRecipes.reduce((sum, item) => sum + (item.protein || 0), 0)
  
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
  
          {/* Added Recipes for Selected Date - Only show if there are recipes */}
          {addedRecipes.length > 0 && (
            <div className="card" style={{ marginBottom: 16, padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </h2>
                <div style={{ fontSize: 14, fontWeight: 500 }}>
                  {totalCalories} kcal • {totalProtein}g protein
                </div>
              </div>
  
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {addedRecipes.map(item => (
                  <div 
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      padding: 10,
                      borderRadius: 6,
                      background: 'var(--bg)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                        {item.calories} kcal
                        {item.protein !== null && ` • ${item.protein}g protein`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFromDate(item.id)}
                      style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        background: 'transparent',
                        color: '#ef4444',
                        border: '1px solid #ef4444',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
  
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
              <div className="saved-recipes-wrapper" style={{ width: '100%' }}>
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
                      <div className="recipe-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate('/add-recipe', { state: { recipe } })
                          }}
                          style={{
                            padding: '3px 6px',
                            fontSize: 11,
                            background: 'transparent',
                            color: isSelected ? 'white' : 'var(--text)',
                            border: `1px solid ${isSelected ? 'rgba(255,255,255,0.3)' : 'var(--border)'}`,
                            borderRadius: 4,
                            cursor: 'pointer',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRecipe(recipe.id)
                          }}
                          style={{
                            padding: '3px 6px',
                            fontSize: 11,
                            background: 'transparent',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            borderRadius: 4,
                            cursor: 'pointer',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          Delete
                        </button>
                        <input
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
                    </div>
                  )
                })}
              </div>
  
              {selectedRecipeIds.size > 0 && (
                <button
                  onClick={handleAddSelectedRecipes}
                  style={{
                    width: '100%',
                    padding: 12,
                    marginTop: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    background: 'var(--accent1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                >
                  Add {selectedRecipeIds.size} {selectedRecipeIds.size === 1 ? 'recipe' : 'recipes'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }
