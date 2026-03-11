import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { recipesAPI, categoriesAPI, favoritesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import RecipeCard from '../components/RecipeCard'

const Recipes = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [recipes, setRecipes] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    ingredient: searchParams.get('ingredient') || ''
  })
  const { user } = useAuth()
  const { success, error } = useToast()

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await categoriesAPI.getAll()
        setCategories(data || [])
      } catch (err) {
        console.error('Error fetching categories:', err)
      }
    }
    fetchCategories()
  }, [])

  useEffect(() => {
    const fetchRecipes = async () => {
      setLoading(true)
      try {
        let response
        if (filters.ingredient) {
          response = await recipesAPI.searchByIngredient(filters.ingredient)
          setRecipes(response.data || [])
        } else {
          response = await recipesAPI.getAll({
            search: filters.search,
            category: filters.category
          })
          setRecipes(response.data || [])
        }
      } catch (err) {
        error('Failed to load recipes')
        console.error('Error fetching recipes:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchRecipes()
  }, [filters])

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    setSearchParams(params)
  }

  const handleFavorite = async (recipeId) => {
    if (!user) {
      error('Please login to add favorites')
      return
    }
    try {
      await favoritesAPI.add(recipeId)
      success('Added to favorites!')
    } catch (err) {
      if (err.response?.status === 400) {
        error('Already in favorites')
      } else {
        error('Failed to add to favorites')
      }
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            All Recipes
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400">
            Discover delicious recipes from around the world
          </p>
        </div>

        {/* Filters */}
        <div className="card p-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search recipes..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="input"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>

            {/* Ingredient Search */}
            <input
              type="text"
              placeholder="Search by ingredient..."
              value={filters.ingredient}
              onChange={(e) => handleFilterChange('ingredient', e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-secondary-200 dark:bg-secondary-700"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4"></div>
                  <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : recipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onFavorite={handleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
              No recipes found
            </h3>
            <p className="text-secondary-500 dark:text-secondary-400 mb-4">
              Try adjusting your filters or search terms
            </p>
            {user && (
              <Link to="/recipes/new" className="btn btn-primary">
                Create a Recipe
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Recipes

