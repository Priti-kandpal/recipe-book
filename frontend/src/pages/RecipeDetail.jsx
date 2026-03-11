import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { recipesAPI, ratingsAPI, favoritesAPI, mealPlansAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import RatingStars from '../components/RatingStars'

const RecipeDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { success, error } = useToast()
  
  const [recipe, setRecipe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showRatingForm, setShowRatingForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [showMealPlanModal, setShowMealPlanModal] = useState(false)
  const [mealPlanDate, setMealPlanDate] = useState('')
  const [mealPlanType, setMealPlanType] = useState('dinner')

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const { data } = await recipesAPI.getById(id)
        setRecipe(data)
      } catch (err) {
        error('Failed to load recipe')
        navigate('/recipes')
      } finally {
        setLoading(false)
      }
    }
    fetchRecipe()
  }, [id])

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      success('Link copied to clipboard!')
    } catch (err) {
      error('Failed to copy link')
    }
  }

  const handleFavorite = async () => {
    if (!user) {
      navigate('/login')
      return
    }
    try {
      await favoritesAPI.add(id)
      success('Added to favorites!')
    } catch (err) {
      if (err.response?.status === 400) {
        error('Already in favorites')
      } else {
        error('Failed to add to favorites')
      }
    }
  }

  const handleAddToMealPlan = async (e) => {
    e.preventDefault()
    try {
      await mealPlansAPI.add({
        recipeId: id,
        plannedDate: mealPlanDate,
        mealType: mealPlanType
      })
      success('Added to meal plan!')
      setShowMealPlanModal(false)
    } catch (err) {
      error('Failed to add to meal plan')
    }
  }

  const handleSubmitRating = async (e) => {
    e.preventDefault()
    if (rating === 0) {
      error('Please select a rating')
      return
    }
    try {
      await ratingsAPI.add(id, { rating, review })
      success('Rating submitted!')
      setShowRatingForm(false)
      // Refresh recipe data
      const { data } = await recipesAPI.getById(id)
      setRecipe(data)
    } catch (err) {
      error('Failed to submit rating')
    }
  }

  const defaultImage = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&h=400&fit=crop'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary-600 dark:text-secondary-400">Loading recipe...</p>
        </div>
      </div>
    )
  }

  if (!recipe) return null

  const ingredients = typeof recipe.ingredients === 'string' 
    ? JSON.parse(recipe.ingredients) 
    : recipe.ingredients || []
  const instructions = typeof recipe.instructions === 'string' 
    ? JSON.parse(recipe.instructions) 
    : recipe.instructions || []

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Link to="/recipes" className="inline-flex items-center gap-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-500 mb-6">
          ← Back to Recipes
        </Link>

        {/* Recipe Header */}
        <div className="card overflow-hidden mb-8">
          <div className="relative h-64 md:h-96">
            <img
              src={recipe.image_url || defaultImage}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              {recipe.category && (
                <span 
                  className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-3"
                  style={{ backgroundColor: recipe.category.color || '#f97316' }}
                >
                  {recipe.category.icon} {recipe.category.name}
                </span>
              )}
              <h1 className="font-heading text-3xl md:text-4xl font-bold mb-2">
                {recipe.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {recipe.avgRating > 0 && (
                  <span className="flex items-center gap-1">
                    <RatingStars rating={recipe.avgRating} small />
                    <span>({recipe.totalRatings} reviews)</span>
                  </span>
                )}
                {recipe.user && (
                  <span>by {recipe.user.full_name}</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 bg-secondary-50 dark:bg-secondary-800 flex flex-wrap gap-3">
            <button onClick={handleShare} className="btn btn-secondary flex items-center gap-2">
              📤 Share
            </button>
            <button onClick={handleFavorite} className="btn btn-secondary flex items-center gap-2">
              🤍 Save
            </button>
            <button onClick={() => setShowMealPlanModal(true)} className="btn btn-secondary flex items-center gap-2">
              📅 Add to Meal Plan
            </button>
            {user && recipe.user?.id === user.id && (
              <Link to={`/recipes/${id}/edit`} className="btn btn-primary">
                ✏️ Edit Recipe
              </Link>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            {recipe.description && (
              <div className="card p-6">
                <h2 className="font-heading text-xl font-semibold text-secondary-900 dark:text-white mb-4">
                  Description
                </h2>
                <p className="text-secondary-600 dark:text-secondary-400 leading-relaxed">
                  {recipe.description}
                </p>
              </div>
            )}

            {/* Ingredients */}
            <div className="card p-6">
              <h2 className="font-heading text-xl font-semibold text-secondary-900 dark:text-white mb-4">
                Ingredients
              </h2>
              <ul className="space-y-3">
                {ingredients.map((ing, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="w-2 h-2 mt-2 rounded-full bg-primary-500 flex-shrink-0"></span>
                    <span className="text-secondary-700 dark:text-secondary-300">
                      {ing.amount} {ing.unit} <strong>{ing.name}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="card p-6">
              <h2 className="font-heading text-xl font-semibold text-secondary-900 dark:text-white mb-4">
                Instructions
              </h2>
              <ol className="space-y-4">
                {instructions.map((step, index) => (
                  <li key={index} className="flex gap-4">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <p className="text-secondary-700 dark:text-secondary-300 pt-1">
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Ratings */}
            <div className="card p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-heading text-xl font-semibold text-secondary-900 dark:text-white">
                  Reviews & Ratings
                </h2>
                <button 
                  onClick={() => setShowRatingForm(!showRatingForm)}
                  className="btn btn-primary"
                >
                  {showRatingForm ? 'Cancel' : 'Write a Review'}
                </button>
              </div>

              {/* Rating Form */}
              {showRatingForm && user && (
                <form onSubmit={handleSubmitRating} className="mb-6 p-4 bg-secondary-50 dark:bg-secondary-700 rounded-lg">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Your Rating
                    </label>
                    <RatingStars rating={rating} onRate={setRating} />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                      Your Review (optional)
                    </label>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      className="input h-24"
                      placeholder="Share your experience with this recipe..."
                    ></textarea>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Submit Review
                  </button>
                </form>
              )}

              {/* Ratings List */}
              <div className="space-y-4">
                {recipe.ratings?.length > 0 ? (
                  recipe.ratings.map((r) => (
                    <div key={r.id} className="border-b border-secondary-200 dark:border-secondary-700 pb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                          {r.user?.full_name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-secondary-900 dark:text-white">
                            {r.user?.full_name || 'Anonymous'}
                          </p>
                          <RatingStars rating={r.rating} small />
                        </div>
                      </div>
                      {r.review && (
                        <p className="text-secondary-600 dark:text-secondary-400 ml-13">
                          {r.review}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-secondary-500 dark:text-secondary-400 text-center py-4">
                    No reviews yet. Be the first to review!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recipe Info */}
            <div className="card p-6">
              <h3 className="font-heading text-lg font-semibold text-secondary-900 dark:text-white mb-4">
                Recipe Info
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-secondary-500 dark:text-secondary-400">Prep Time</span>
                  <span className="font-medium text-secondary-900 dark:text-white">{recipe.prep_time || 0} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500 dark:text-secondary-400">Cook Time</span>
                  <span className="font-medium text-secondary-900 dark:text-white">{recipe.cook_time || 0} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500 dark:text-secondary-400">Total Time</span>
                  <span className="font-medium text-secondary-900 dark:text-white">
                    {(recipe.prep_time || 0) + (recipe.cook_time || 0)} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500 dark:text-secondary-400">Servings</span>
                  <span className="font-medium text-secondary-900 dark:text-white">{recipe.servings || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-500 dark:text-secondary-400">Difficulty</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    recipe.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    recipe.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {recipe.difficulty}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Meal Plan Modal */}
        {showMealPlanModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-md w-full animate-scale-in">
              <h3 className="font-heading text-xl font-semibold text-secondary-900 dark:text-white mb-4">
                Add to Meal Plan
              </h3>
              <form onSubmit={handleAddToMealPlan}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={mealPlanDate}
                    onChange={(e) => setMealPlanDate(e.target.value)}
                    required
                    className="input"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Meal Type
                  </label>
                  <select
                    value={mealPlanType}
                    onChange={(e) => setMealPlanType(e.target.value)}
                    className="input"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowMealPlanModal(false)} className="btn btn-secondary flex-1">
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

export default RecipeDetail

