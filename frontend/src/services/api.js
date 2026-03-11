import axios from 'axios';


const API_URL = import.meta.env.VITE_API_URL; 

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data)
};

// Recipes API
export const recipesAPI = {
  getAll: (params) => api.get('/recipes', { params }),
  getById: (id) => api.get(`/recipes/${id}`),
  create: (data) => api.post('/recipes', data),
  update: (id, data) => api.put(`/recipes/${id}`, data),
  delete: (id) => api.delete(`/recipes/${id}`),
  searchByIngredient: (ingredient) => api.get('/recipes/search/ingredients', { params: { ingredient } }),
  getMyRecipes: () => api.get('/recipes/user/my-recipes')
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

// Ratings API
export const ratingsAPI = {
  getByRecipe: (recipeId) => api.get(`/ratings/${recipeId}`),
  add: (recipeId, data) => api.post(`/ratings/${recipeId}`, data),
  delete: (id) => api.delete(`/ratings/${id}`)
};

// Meal Plans API
export const mealPlansAPI = {
  getAll: (params) => api.get('/meal-plans', { params }),
  add: (data) => api.post('/meal-plans', data),
  update: (id, data) => api.put(`/meal-plans/${id}`, data),
  delete: (id) => api.delete(`/meal-plans/${id}`)
};

// Favorites API
export const favoritesAPI = {
  getAll: () => api.get('/favorites'),
  add: (recipeId) => api.post('/favorites', { recipeId }),
  remove: (id) => api.delete(`/favorites/${id}`),
  check: (recipeId) => api.get(`/favorites/check/${recipeId}`)
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getRecipeStats: (recipeId) => api.get('/analytics/recipes', { params: { recipeId } })
};

// Upload API
export const uploadAPI = {
  uploadImage: (formData) => api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteImage: (imagePath) => api.delete('/upload/image', { data: { imagePath } })
};

export default api;

