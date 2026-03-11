import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { recipesAPI, categoriesAPI, favoritesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import RecipeCard from '../components/RecipeCard'

const Home = () => {
  const [recipes, setRecipes] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchIngredient, setSearchIngredient] = useState('')
  const { user } = useAuth()
  const { success, error } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recipesRes, categoriesRes] = await Promise.all([
          recipesAPI.getAll({ limit: 8 }),
          categoriesAPI.getAll()
        ])
        setRecipes(recipesRes.data || [])
        setCategories(categoriesRes.data || [])
      } catch (err) {
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSearchByIngredient = async (e) => {
    e.preventDefault()
    if (searchIngredient.trim()) {
      navigate(`/recipes?ingredient=${encodeURIComponent(searchIngredient)}`)
    }
  }

  const handleFavorite = async (recipeId) => {
    if (!user) {
      navigate('/login')
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

  const defaultImage = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop'

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 text-8xl animate-pulse">🍳</div>
          <div className="absolute bottom-10 right-10 text-8xl animate-pulse">🥗</div>
          <div className="absolute top-1/2 left-1/2 text-8xl animate-pulse">🍝</div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-heading text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
              Your Personal Recipe <span className="text-primary-500">Collection</span>
            </h1>
            <p className="text-xl text-secondary-300 mb-8">
              Create, organize, and share your favorite recipes with the world. 
              Plan meals, discover new dishes, and become a better cook.
            </p>
            
            {/* Search by Ingredient */}
            <form onSubmit={handleSearchByIngredient} className="max-w-xl mx-auto mb-8">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search by ingredient (e.g., chicken, pasta...)"
                  value={searchIngredient}
                  onChange={(e) => setSearchIngredient(e.target.value)}
                  className="flex-1 px-6 py-3 rounded-full text-secondary-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button type="submit" className="btn btn-primary px-6 py-3 rounded-full">
                  Search
                </button>
              </div>
            </form>

            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/recipes" className="btn bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-full text-lg">
                Browse Recipes
              </Link>
              {user ? (
                <Link to="/recipes/new" className="btn bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full text-lg border border-white/30">
                  Create Recipe
                </Link>
              ) : (
                <Link to="/register" className="btn bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-full text-lg border border-white/30">
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-secondary-50 dark:bg-secondary-900">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-center mb-12 text-secondary-900 dark:text-white">
            Browse by <span className="text-primary-500">Category</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                to={`/recipes?category=${category.slug}`}
                className="card p-6 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                  {category.icon}
                </div>
                <h3 className="font-semibold text-secondary-900 dark:text-white mb-1">
                  {category.name}
                </h3>
                <p className="text-sm text-secondary-500 dark:text-secondary-400">
                  {category.recipeCount || 0} recipes
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Recipes Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-secondary-900 dark:text-white">
              Latest <span className="text-primary-500">Recipes</span>
            </h2>
            <Link to="/recipes" className="text-primary-500 hover:text-primary-600 font-medium">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onFavorite={handleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🍽️</div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
                No recipes yet
              </h3>
              <p className="text-secondary-500 dark:text-secondary-400 mb-4">
                Be the first to add a recipe!
              </p>
              {user && (
                <Link to="/recipes/new" className="btn btn-primary">
                  Create Recipe
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-secondary-50 dark:bg-secondary-900">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-center mb-12 text-secondary-900 dark:text-white">
            Everything You Need to <span className="text-primary-500">Cook</span>
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                📝
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
                Create Recipes
              </h3>
              <p className="text-secondary-500 dark:text-secondary-400">
                Add your own recipes with ingredients, instructions, photos, and more.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                📅
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
                Meal Planning
              </h3>
              <p className="text-secondary-500 dark:text-secondary-400">
                Plan your weekly meals and never wonder what's for dinner again.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                ⭐
              </div>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
                Reviews & Ratings
              </h3>
              <p className="text-secondary-500 dark:text-secondary-400">
                Rate recipes and see what others think about your favorites.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

