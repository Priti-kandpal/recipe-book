import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { recipesAPI, categoriesAPI, uploadAPI } from '../services/api'
import { useToast } from '../context/ToastContext'

const RecipeForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { success, error } = useToast()
  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState([])
  const [imageUploading, setImageUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '',
    categoryId: '',
    isPublic: false,
    prepTime: '',
    cookTime: '',
    servings: '',
    ingredients: [{ name: '', quantity: '', unit: '' }],
    instructions: [''],
    isFavorite: false
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: cats } = await categoriesAPI.getAll()
        setCategories(cats || [])

        if (isEditing) {
          const { data: recipe } = await recipesAPI.getById(id)
          if (recipe) {
            // Parse ingredients and instructions if they're stored as strings
            let parsedIngredients = recipe.ingredients
            let parsedInstructions = recipe.instructions
            
            if (typeof recipe.ingredients === 'string') {
              try {
                parsedIngredients = JSON.parse(recipe.ingredients)
              } catch (e) {
                parsedIngredients = []
              }
            }
            
            if (typeof recipe.instructions === 'string') {
              try {
                parsedInstructions = JSON.parse(recipe.instructions)
              } catch (e) {
                parsedInstructions = []
              }
            }
            
            setFormData({
              title: recipe.title || '',
              description: recipe.description || '',
              imageUrl: recipe.image_url || '',
              categoryId: recipe.category_id || '',
              isPublic: recipe.is_public || false,
              prepTime: recipe.prep_time || '',
              cookTime: recipe.cook_time || '',
              servings: recipe.servings || '',
              ingredients: parsedIngredients && parsedIngredients.length > 0 
                ? parsedIngredients 
                : [{ name: '', quantity: '', unit: '' }],
              instructions: parsedInstructions && parsedInstructions.length > 0 
                ? parsedInstructions 
                : ['']
            })
          }
        }
      } catch (err) {
        error('Failed to load data')
      }
    }
    fetchData()
  }, [id, isEditing])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Ingredient handlers
  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...formData.ingredients]
    newIngredients[index][field] = value
    setFormData(prev => ({ ...prev, ingredients: newIngredients }))
  }

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', quantity: '', unit: '' }]
    }))
  }

  const removeIngredient = (index) => {
    if (formData.ingredients.length > 1) {
      const newIngredients = formData.ingredients.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, ingredients: newIngredients }))
    }
  }

  // Instruction handlers
  const handleInstructionChange = (index, value) => {
    const newInstructions = [...formData.instructions]
    newInstructions[index] = value
    setFormData(prev => ({ ...prev, instructions: newInstructions }))
  }

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }))
  }

  const removeInstruction = (index) => {
    if (formData.instructions.length > 1) {
      const newInstructions = formData.instructions.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, instructions: newInstructions }))
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImageUploading(true)
    try {
      const formDataImg = new FormData()
      formDataImg.append('image', file)
      const { data } = await uploadAPI.uploadImage(formDataImg)
      setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }))
      success('Image uploaded!')
    } catch (err) {
      error('Failed to upload image')
    } finally {
      setImageUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Filter out empty ingredients and instructions
      const filteredIngredients = formData.ingredients.filter(ing => ing.name.trim() !== '')
      const filteredInstructions = formData.instructions.filter(inst => inst.trim() !== '')

      const recipeData = {
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl,
        categoryId: formData.categoryId || null,
        isPublic: formData.isPublic,
        prepTime: formData.prepTime ? parseInt(formData.prepTime) : null,
        cookTime: formData.cookTime ? parseInt(formData.cookTime) : null,
        servings: formData.servings ? parseInt(formData.servings) : 1,
        ingredients: filteredIngredients,
        instructions: filteredInstructions
      }

      if (isEditing) {
        await recipesAPI.update(id, recipeData)
        success('Recipe updated!')
      } else {
        await recipesAPI.create(recipeData)
        success('Recipe created!')
      }
      navigate('/recipes')
    } catch (err) {
      error(err.response?.data?.error || 'Failed to save recipe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/recipes" className="inline-flex items-center gap-2 text-secondary-600 dark:text-secondary-400 hover:text-primary-500 mb-4">
            ← Back to Recipes
          </Link>
          <h1 className="font-heading text-3xl font-bold text-secondary-900 dark:text-white">
            {isEditing ? 'Edit Recipe' : 'Create New Recipe'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="card p-6">
            <h2 className="font-heading text-xl font-semibold mb-4 text-secondary-900 dark:text-white">
              Basic Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Recipe Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="e.g., Chocolate Chip Cookies"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input h-24"
                  placeholder="Describe your recipe..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Category
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Time & Servings */}
          <div className="card p-6">
            <h2 className="font-heading text-xl font-semibold mb-4 text-secondary-900 dark:text-white">
              Time & Servings
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Prep Time (min)
                </label>
                <input
                  type="number"
                  name="prepTime"
                  value={formData.prepTime}
                  onChange={handleChange}
                  className="input"
                  placeholder="15"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Cook Time (min)
                </label>
                <input
                  type="number"
                  name="cookTime"
                  value={formData.cookTime}
                  onChange={handleChange}
                  className="input"
                  placeholder="30"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                  Servings
                </label>
                <input
                  type="number"
                  name="servings"
                  value={formData.servings}
                  onChange={handleChange}
                  className="input"
                  placeholder="4"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading text-xl font-semibold text-secondary-900 dark:text-white">
                Ingredients
              </h2>
              <button
                type="button"
                onClick={addIngredient}
                className="btn btn-secondary text-sm"
              >
                + Add Ingredient
              </button>
            </div>
            <div className="space-y-3">
              {formData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={ingredient.name}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    className="input flex-1"
                    placeholder="Ingredient name"
                  />
                  <input
                    type="text"
                    value={ingredient.quantity}
                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                    className="input w-20"
                    placeholder="Qty"
                  />
                  <input
                    type="text"
                    value={ingredient.unit}
                    onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                    className="input w-20"
                    placeholder="Unit"
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="btn bg-red-100 text-red-600 hover:bg-red-200 px-3"
                    disabled={formData.ingredients.length === 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-heading text-xl font-semibold text-secondary-900 dark:text-white">
                Steps / Instructions
              </h2>
              <button
                type="button"
                onClick={addInstruction}
                className="btn btn-secondary text-sm"
              >
                + Add Step
              </button>
            </div>
            <div className="space-y-3">
              {formData.instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <span className="mt-3 text-sm font-medium text-secondary-500 min-w-[24px]">
                    {index + 1}.
                  </span>
                  <textarea
                    value={instruction}
                    onChange={(e) => handleInstructionChange(index, e.target.value)}
                    className="input flex-1 h-20"
                    placeholder={`Step ${index + 1}...`}
                  />
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    className="btn bg-red-100 text-red-600 hover:bg-red-200 px-3 mt-1"
                    disabled={formData.instructions.length === 1}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="card p-6">
            <h2 className="font-heading text-xl font-semibold mb-4 text-secondary-900 dark:text-white">
              Recipe Image
            </h2>
            <div className="space-y-4">
              {formData.imageUrl ? (
                <div className="relative">
                  <img
                    src={formData.imageUrl}
                    alt="Recipe"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    className="absolute top-2 right-2 btn bg-red-500 text-white px-3 py-1 rounded-full text-sm"
                  >
                    ✕ Remove
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={imageUploading}
                    className="input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {imageUploading && <p className="text-sm text-secondary-500 mt-2">Uploading...</p>}
                </div>
              )}
            </div>
          </div>

          {/* Visibility */}
          <div className="card p-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleChange}
                className="w-5 h-5 rounded border-secondary-300 text-primary-500 focus:ring-primary-500"
              />
              <div>
                <p className="font-medium text-secondary-900 dark:text-white">
                  Make this recipe public
                </p>
              </div>
            </label>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/recipes')}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Saving...' : isEditing ? 'Update Recipe' : 'Create Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RecipeForm

