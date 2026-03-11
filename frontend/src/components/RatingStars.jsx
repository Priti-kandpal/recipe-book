const RatingStars = ({ rating, onRate, small = false }) => {
  const stars = [1, 2, 3, 4, 5]

  return (
    <div className={`star-rating ${small ? 'text-sm' : 'text-2xl'}`}>
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate?.(star)}
          disabled={!onRate}
          className={`${onRate ? 'cursor-pointer' : 'cursor-default'} ${
            star <= rating ? 'text-yellow-400' : 'text-secondary-300 dark:text-secondary-600'
          }`}
        >
          {star <= rating ? '★' : '☆'}
        </button>
      ))}
      {rating > 0 && (
        <span className={`ml-1 text-secondary-500 dark:text-secondary-400 ${small ? 'text-xs' : 'text-sm'}`}>
          ({rating.toFixed(1)})
        </span>
      )}
    </div>
  )
}

export default RatingStars

