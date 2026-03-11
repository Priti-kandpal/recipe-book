import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'

const Header = () => {
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { success } = useToast()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/recipes?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
    }
  }

  const handleLogout = async () => {
    await logout()
    success('Logged out successfully')
    navigate('/')
  }

  return (
    <header className="bg-white dark:bg-secondary-800 shadow-md sticky top-0 z-40 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">🍳</span>
            </div>
            <span className="font-heading text-xl font-bold text-secondary-900 dark:text-white">
              Recipe<span className="text-primary-500">Book</span>
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-full bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400">🔍</span>
            </div>
          </form>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/recipes" className="text-secondary-600 dark:text-secondary-300 hover:text-primary-500 dark:hover:text-primary-400 font-medium transition-colors">
              Recipes
            </Link>
            <Link to="/categories" className="text-secondary-600 dark:text-secondary-300 hover:text-primary-500 dark:hover:text-primary-400 font-medium transition-colors">
              Categories
            </Link>
            
            {user ? (
              <>
                <Link to="/meal-planner" className="text-secondary-600 dark:text-secondary-300 hover:text-primary-500 dark:hover:text-primary-400 font-medium transition-colors">
                  Meal Plan
                </Link>
                <Link to="/dashboard" className="text-secondary-600 dark:text-secondary-300 hover:text-primary-500 dark:hover:text-primary-400 font-medium transition-colors">
                  Dashboard
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 text-secondary-600 dark:text-secondary-300 hover:text-primary-500">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                      {user.fullName?.[0] || user.email[0].toUpperCase()}
                    </div>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-secondary-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-2">
                      <p className="px-3 py-1 text-sm text-secondary-500 dark:text-secondary-400">
                        {user.email}
                      </p>
                      <hr className="my-2 border-secondary-200 dark:border-secondary-700" />
                      <Link to="/dashboard" className="block px-3 py-2 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded">
                        My Dashboard
                      </Link>
                      <Link to="/favorites" className="block px-3 py-2 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded">
                        Favorites
                      </Link>
                      <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-500 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded">
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn btn-ghost text-secondary-600 dark:text-secondary-300">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary-100 dark:hover:bg-secondary-700"
          >
            <span className="text-2xl">{isMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-secondary-200 dark:border-secondary-700">
            {/* Search - Mobile */}
            <form onSubmit={handleSearch} className="mb-4">
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg bg-secondary-50 dark:bg-secondary-700 text-secondary-900 dark:text-white"
              />
            </form>

            {/* Nav Links - Mobile */}
            <nav className="flex flex-col gap-2">
              <Link to="/recipes" className="px-4 py-2 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg">
                Recipes
              </Link>
              <Link to="/categories" className="px-4 py-2 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg">
                Categories
              </Link>
              
              {user ? (
                <>
                  <Link to="/meal-planner" className="px-4 py-2 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg">
                    Meal Plan
                  </Link>
                  <Link to="/dashboard" className="px-4 py-2 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg">
                    Dashboard
                  </Link>
                  <Link to="/favorites" className="px-4 py-2 text-secondary-700 dark:text-secondary-200 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg">
                    Favorites
                  </Link>
                  <button onClick={handleLogout} className="px-4 py-2 text-left text-red-500 hover:bg-secondary-100 dark:hover:bg-secondary-700 rounded-lg">
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex gap-2 mt-2">
                  <Link to="/login" className="flex-1 btn btn-ghost text-center">
                    Login
                  </Link>
                  <Link to="/register" className="flex-1 btn btn-primary text-center">
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header

