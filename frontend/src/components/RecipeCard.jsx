import { Link } from 'react-router-dom'
import RatingStars from './RatingStars'

const RecipeCard = ({ recipe, onFavorite, isFavorite }) => {
  const defaultImage = 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=300&fit=crop'

  return (
    <div className="card-hover group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={recipe.image_url || defaultImage}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {recipe.category && (
          <span 
            className="absolute top-3 left-3 px-2 py-1 text-xs font-medium rounded-full text-white"
            style={{ backgroundColor: recipe.category.color || '#f97316' }}
          >
            {recipe.category.icon} {recipe.category.name}
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault()
            onFavorite?.(recipe.id)
          }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-secondary-800/90 rounded-full flex items-center justify-center text-xl hover:scale-110 transition-transform"
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Content */}
      <Link to={`/recipes/${recipe.id}`} className="block p-4">
        <h3 className="font-heading text-lg font-semibold text-secondary-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary-500 transition-colors">
          {recipe.title}
        </h3>
        <p className="text-secondary-500 dark:text-secondary-400 text-sm mb-3 line-clamp-2">
          {recipe.description}
        </p>

        {/* Meta info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-secondary-500 dark:text-secondary-400">
            {recipe.prep_time && (
              <span className="flex items-center gap-1">
                ⏱️ {recipe.prep_time + (recipe.cook_time || 0)} min
              </span>
            )}
            <span className={`px-2 py-0.5 rounded text-xs ${
              recipe.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
              recipe.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {recipe.difficulty}
            </span>
          </div>
          {recipe.avgRating > 0 && (
            <RatingStars rating={recipe.avgRating} small />
          )}
        </div>
      </Link>
    </div>
  )
}

export default RecipeCard

