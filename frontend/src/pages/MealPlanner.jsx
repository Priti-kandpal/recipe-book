import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { mealPlansAPI, recipesAPI } from '../services/api'
import { useToast } from '../context/ToastContext'

const MealPlanner = () => {
  const [mealPlans, setMealPlans] = useState([])
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState('')
  const [selectedMealType, setSelectedMealType] = useState('dinner')
  const { success, error } = useToast()

  useEffect(() => {
    fetchMealPlans()
    fetchRecipes()
  }, [currentWeek])

  const fetchMealPlans = async () => {
    try {
      const startOfWeek = getStartOfWeek(currentWeek)
      const endOfWeek = getEndOfWeek(currentWeek)
      const { data } = await mealPlansAPI.getAll({
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: endOfWeek.toISOString().split('T')[0]
      })
      setMealPlans(data || [])
    } catch (err) {
      error('Failed to load meal plans')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecipes = async () => {
    try {
      const { data } = await recipesAPI.getMyRecipes()
      setRecipes(data || [])
    } catch (err) {
      console.error('Error fetching recipes:', err)
    }
  }

  const getStartOfWeek = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  const getEndOfWeek = (date) => {
    const start = getStartOfWeek(date)
    return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)
  }

  const getWeekDays = () => {
    const start = getStartOfWeek(currentWeek)
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      days.push(day)
    }
    return days
  }

  const formatDate = (date) => {
    return date.toISOString().split('T')[0]
  }

  const getMealsForDay = (date) => {
    const dateStr = formatDate(date)
    return mealPlans.filter(mp => mp.planned_date === dateStr)
  }

  const handleAddMeal = async (e) => {
    e.preventDefault()
    try {
      await mealPlansAPI.add({
        recipeId: selectedRecipe,
        plannedDate: selectedDate,
        mealType: selectedMealType
      })
      success('Meal added to plan!')
      setShowAddModal(false)
      fetchMealPlans()
    } catch (err) {
      error('Failed to add meal')
    }
  }

  const handleDeleteMeal = async (id) => {
    try {
      await mealPlansAPI.delete(id)
      success('Meal removed')
      fetchMealPlans()
    } catch (err) {
      error('Failed to remove meal')
    }
  }

  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() + (direction * 7))
    setCurrentWeek(newDate)
  }

  const weekDays = getWeekDays()
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack']

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-secondary-900 dark:text-white mb-2">
              Meal Planner
            </h1>
            <p className="text-secondary-500 dark:text-secondary-400">
              Plan your weekly meals
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
          >
            + Add Meal
          </button>
        </div>

        {/* Week Navigation */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateWeek(-1)}
              className="btn btn-ghost"
            >
              ← Previous
            </button>
            <h2 className="font-heading text-xl font-semibold text-secondary-900 dark:text-white">
              {weekDays[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateWeek(1)}
              className="btn btn-ghost"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day) => (
              <div key={day.toISOString()} className="card p-4 min-h-[300px]">
                <div className="text-center mb-4">
                  <p className="text-sm text-secondary-500 dark:text-secondary-400">
                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className={`text-lg font-semibold ${
                    formatDate(day) === formatDate(new Date())
                      ? 'text-primary-500'
                      : 'text-secondary-900 dark:text-white'
                  }`}>
                    {day.getDate()}
                  </p>
                </div>

                <div className="space-y-2">
                  {mealTypes.map(type => {
                    const meals = getMealsForDay(day).filter(m => m.meal_type === type)
                    return (
                      <div key={type} className="text-sm">
                        <p className="text-xs text-secondary-500 dark:text-secondary-400 capitalize mb-1">
                          {type}
                        </p>
                        {meals.map(meal => (
                          <div
                            key={meal.id}
                            className="bg-primary-50 dark:bg-primary-900/30 p-2 rounded text-xs mb-1 group relative"
                          >
                            <Link
                              to={`/recipes/${meal.recipe_id}`}
                              className="text-secondary-900 dark:text-white hover:text-primary-500"
                            >
                              {meal.recipe?.title || 'Recipe'}
                            </Link>
                            <button
                              onClick={() => handleDeleteMeal(meal.id)}
                              className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Meal Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-md w-full animate-scale-in">
              <h3 className="font-heading text-xl font-semibold text-secondary-900 dark:text-white mb-4">
                Add Meal to Plan
              </h3>
              <form onSubmit={handleAddMeal}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Select Recipe
                  </label>
                  <select
                    value={selectedRecipe}
                    onChange={(e) => setSelectedRecipe(e.target.value)}
                    required
                    className="input"
                  >
                    <option value="">Choose a recipe...</option>
                    {recipes.map(r => (
                      <option key={r.id} value={r.id}>{r.title}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                    className="input"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Meal Type
                  </label>
                  <select
                    value={selectedMealType}
                    onChange={(e) => setSelectedMealType(e.target.value)}
                    className="input"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MealPlanner

