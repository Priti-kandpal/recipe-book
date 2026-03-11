import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { favoritesAPI } from '../services/api'
import { useToast } from '../context/ToastContext'
import RecipeCard from '../components/RecipeCard'

const Favorites = () => {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const { success, error } = useToast()

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      const { data } = await favoritesAPI.getAll()
      setFavorites(data || [])
    } catch (err) {
      error('Failed to load favorites')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFavorite = async (id) => {
    try {
      await favoritesAPI.remove(id)
      success('Removed from favorites')
      setFavorites(favorites.filter(f => f.id !== id))
    } catch (err) {
      error('Failed to remove from favorites')
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-secondary-900 dark:text-white mb-2">
            My Favorites
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400">
            Your saved recipes collection
          </p>
        </div>

        {/* Favorites Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-secondary-200 dark:bg-secondary-700"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-3/4"></div>
                  <div className="h-3 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((fav) => (
              <div key={fav.id} className="relative">
                <RecipeCard
                  recipe={fav.recipe}
                  onFavorite={() => handleRemoveFavorite(fav.id)}
                  isFavorite={true}
                />
                <button
                  onClick={() => handleRemoveFavorite(fav.id)}
                  className="absolute top-3 right-3 z-10 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  title="Remove from favorites"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">❤️</div>
            <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-2">
              No favorites yet
            </h3>
            <p className="text-secondary-500 dark:text-secondary-400 mb-4">
              Save your favorite recipes to access them quickly
            </p>
            <Link to="/recipes" className="btn btn-primary">
              Browse Recipes
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Favorites

