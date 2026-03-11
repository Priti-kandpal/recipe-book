import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { categoriesAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '🍽️',
    color: '#f97316'
  })
  const { user } = useAuth()
  const { success, error } = useToast()

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data } = await categoriesAPI.getAll()
      setCategories(data || [])
    } catch (err) {
      error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, formData)
        success('Category updated!')
      } else {
        await categoriesAPI.create(formData)
        success('Category created!')
      }
      setShowModal(false)
      setEditingCategory(null)
      setFormData({ name: '', slug: '', icon: '🍽️', color: '#f97316' })
      fetchCategories()
    } catch (err) {
      error(err.response?.data?.error || 'Failed to save category')
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      color: category.color
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    
    try {
      await categoriesAPI.delete(id)
      success('Category deleted!')
      fetchCategories()
    } catch (err) {
      error(err.response?.data?.error || 'Failed to delete category')
    }
  }

  const icons = ['🍽️', '🍳', '🥗', '🍝', '🍰', '🍿', '🥤', '🥬', '🍲', '🍕', '🍔', '🌮']
  const colors = ['#f97316', '#22c55e', '#3b82f6', '#ec4899', '#f59e0b', '#06b6d4', '#84cc16', '#8b5cf6']

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold text-secondary-900 dark:text-white mb-2">
              Categories
            </h1>
            <p className="text-secondary-500 dark:text-secondary-400">
              Organize your recipes by category
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCategory(null)
              setFormData({ name: '', slug: '', icon: '🍽️', color: '#f97316' })
              setShowModal(true)
            }}
            className="btn btn-primary"
          >
            + Add Category
          </button>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="h-12 bg-secondary-200 dark:bg-secondary-700 rounded mb-4"></div>
                <div className="h-4 bg-secondary-200 dark:bg-secondary-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div key={category.id} className="card p-6 group">
                <Link to={`/recipes?category=${category.slug}`} className="block">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    {category.icon}
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-secondary-900 dark:text-white text-center mb-1">
                    {category.name}
                  </h3>
                  <p className="text-center text-secondary-500 dark:text-secondary-400 text-sm">
                    {category.recipeCount || 0} recipes
                  </p>
                </Link>
                
                {user && (
                  <div className="flex justify-center gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-sm text-primary-500 hover:text-primary-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-sm text-red-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Category Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-md w-full animate-scale-in">
              <h3 className="font-heading text-xl font-semibold text-secondary-900 dark:text-white mb-4">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    required
                    className="input"
                    placeholder="e.g., Italian"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Icon
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {icons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${
                          formData.icon === icon ? 'bg-primary-500 text-white' : 'bg-secondary-100 dark:bg-secondary-700'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`w-10 h-10 rounded-full ${
                          formData.color === color ? 'ring-2 ring-offset-2 ring-primary-500' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    {editingCategory ? 'Update' : 'Create'}
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

export default Categories

