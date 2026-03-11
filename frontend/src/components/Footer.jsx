import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-secondary-800 text-secondary-300 mt-auto">
      <div className="container mx-auto px-4 py-8">

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xl">🍳</span>
              </div>
              <span className="font-heading text-xl font-bold text-white">
                RecipeBook
              </span>
            </Link>
            <p className="text-secondary-400 text-sm">
              Your personal digital recipe collection.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link to="/recipes" className="hover:text-primary-400 transition-colors">All Recipes</Link></li>
              <li><Link to="/categories" className="hover:text-primary-400 transition-colors">Categories</Link></li>
              <li><Link to="/meal-planner" className="hover:text-primary-400 transition-colors">Meal Planner</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary-400 transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Categories</h4>
            <ul className="space-y-2">
              <li><Link to="/recipes?category=breakfast" className="hover:text-primary-400 transition-colors">Breakfast</Link></li>
              <li><Link to="/recipes?category=lunch" className="hover:text-primary-400 transition-colors">Lunch</Link></li>
              <li><Link to="/recipes?category=dinner" className="hover:text-primary-400 transition-colors">Dinner</Link></li>
              <li><Link to="/recipes?category=desserts" className="hover:text-primary-400 transition-colors">Desserts</Link></li>
            </ul>
          </div>

        </div> {/* ✅ closing grid div */}

        <hr className="border-secondary-700 my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-secondary-400 text-sm">
            © {new Date().getFullYear()} Recipe Book. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm">
            <Link to="#" className="hover:text-primary-400 transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-primary-400 transition-colors">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer