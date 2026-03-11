import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { analyticsAPI, recipesAPI } from '../services/api'
import { useToast } from '../context/ToastContext'

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const { error } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [analyticsRes, recipesRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        recipesAPI.getMyRecipes()
      ])
      setStats(analyticsRes.data)
      setRecipes(recipesRes.data || [])
    } catch (err) {
      error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecipe = async (id) => {
    if (!confirm('Are you sure you want to delete this recipe?')) return
    
    try {
      await recipesAPI.delete(id)
      setRecipes(recipes.filter(r => r.id !== id))
      // Refresh stats
      const { data } = await analyticsAPI.getDashboard()
      setStats(data)
    } catch (err) {
      error('Failed to delete recipe')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary-600 dark:text-secondary-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400">
            Overview of your recipe collection
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <div className="text-3xl mb-2">📝</div>
            <p className="text-3xl font-bold text-secondary-900 dark:text-white">
              {stats?.totalRecipes || 0}
            </p>
            <p className="text-secondary-500 dark:text-secondary-400">Total Recipes</p>
          </div>
          
          <div className="card p-6">
            <div className="text-3xl mb-2">❤️</div>
            <p className="text-3xl font-bold text-secondary-900 dark:text-white">
              {stats?.totalFavorites || 0}
            </p>
            <p className="text-secondary-500 dark:text-secondary-400">Favorites</p>
          </div>
          
          <div className="card p-6">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-3xl font-bold text-secondary-900 dark:text-white">
              {stats?.totalMealPlans || 0}
            </p>
            <p className="text-secondary-500 dark:text-secondary-400">Meal Plans</p>
          </div>
          
          <div className="card p-6">
            <div className="text-3xl mb-2">⭐</div>
            <p className="text-3xl font-bold text-secondary-900 dark:text-white">
              {stats?.avgRating || 0}
            </p>
            <p className="text-secondary-500 dark:text-secondary-400">Avg Rating</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Recipes by Difficulty */}
          <div className="card p-6">
            <h3 className="font-heading text-lg font-semibold text-secondary-900 dark:text-white mb-4">
              Recipes by Difficulty
            </h3>
            <div className="space-y-3">
              {['easy', 'medium', 'hard'].map(diff => {
                const count = stats?.recipesByDifficulty?.[diff] || 0
                const total = stats?.totalRecipes || 1
                const percentage = Math.round((count / total) * 100)
                return (
                  <div key={diff}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize text-secondary-700 dark:text-secondary-300">{diff}</span>
                      <span className="text-secondary-500">{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          diff === 'easy' ? 'bg-green-500' : diff === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recipes by Category */}
          <div className="card p-6">
            <h3 className="font-heading text-lg font-semibold text-secondary-900 dark:text-white mb-4">
              Recipes by Category
            </h3>
            {stats?.recipesByCategory && Object.keys(stats.recipesByCategory).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(stats.recipesByCategory).map(([cat, count]) => (
                  <div key={cat} className="flex justify-between items-center">
                    <span className="text-secondary-700 dark:text-secondary-300">{cat}</span>
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded text-sm">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-secondary-500 dark:text-secondary-400 text-center py-4">
                No categorized recipes yet
              </p>
            )}
          </div>
        </div>

        {/* My Recipes */}
        <div className="card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-heading text-lg font-semibold text-secondary-900 dark:text-white">
              My Recipes
            </h3>
            <Link to="/recipes/new" className="btn btn-primary">
              + New Recipe
            </Link>
          </div>

          {recipes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200 dark:border-secondary-700">
                    <th className="text-left py-3 px-4 text-secondary-500 dark:text-secondary-400 font-medium">Recipe</th>
                    <th className="text-left py-3 px-4 text-secondary-500 dark:text-secondary-400 font-medium">Category</th>
                    <th className="text-left py-3 px-4 text-secondary-500 dark:text-secondary-400 font-medium">Difficulty</th>
                    <th className="text-left py-3 px-4 text-secondary-500 dark:text-secondary-400 font-medium">Rating</th>
                    <th className="text-right py-3 px-4 text-secondary-500 dark:text-secondary-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recipes.slice(0, 5).map(recipe => (
                    <tr key={recipe.id} className="border-b border-secondary-100 dark:border-secondary-700">
                      <td className="py-3 px-4">
                        <Link to={`/recipes/${recipe.id}`} className="font-medium text-secondary-900 dark:text-white hover:text-primary-500">
                          {recipe.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-secondary-600 dark:text-secondary-400">
                        {recipe.category?.name || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          recipe.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                          recipe.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {recipe.difficulty}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-secondary-600 dark:text-secondary-400">
                        {recipe.avgRating || '-'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link to={`/recipes/${recipe.id}/edit`} className="text-primary-500 hover:text-primary-600 mr-3">
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteRecipe(recipe.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-secondary-500 dark:text-secondary-400 mb-4">
                You haven't created any recipes yet
              </p>
              <Link to="/recipes/new" className="btn btn-primary">
                Create Your First Recipe
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

