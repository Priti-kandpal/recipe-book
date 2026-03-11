const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');

// Middleware to verify auth token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = user.id;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get dashboard statistics
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    // Get total recipes count
    const { count: totalRecipes } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId);

    // Get total favorites count
    const { count: totalFavorites } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId);

    // Get total meal plans count
    const { count: totalMealPlans } = await supabase
      .from('meal_plans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId);

    // Get recipes by difficulty
    const { data: recipesByDifficulty } = await supabase
      .from('recipes')
      .select('difficulty')
      .eq('user_id', req.userId);

    const difficultyCounts = {
      easy: 0,
      medium: 0,
      hard: 0
    };

    recipesByDifficulty?.forEach(recipe => {
      if (recipe.difficulty in difficultyCounts) {
        difficultyCounts[recipe.difficulty]++;
      }
    });

    // Get recipes by category
    const { data: recipesByCategory } = await supabase
      .from('recipes')
      .select(`
        category:categories(name)
      `)
      .eq('user_id', req.userId);

    const categoryCounts = {};
    recipesByCategory?.forEach(recipe => {
      const categoryName = recipe.category?.name || 'Uncategorized';
      categoryCounts[categoryName] = (categoryCounts[categoryName] || 0) + 1;
    });

    // Get total ratings received
    const { data: userRecipes } = await supabase
      .from('recipes')
      .select('id')
      .eq('user_id', req.userId);

    const recipeIds = userRecipes?.map(r => r.id) || [];
    
    let totalRatingsReceived = 0;
    let totalRatingSum = 0;

    if (recipeIds.length > 0) {
      const { data: ratings } = await supabase
        .from('recipe_ratings')
        .select('rating')
        .in('recipe_id', recipeIds);

      totalRatingsReceived = ratings?.length || 0;
      totalRatingSum = ratings?.reduce((sum, r) => sum + r.rating, 0) || 0;
    }

    const avgRating = totalRatingsReceived > 0 
      ? Math.round((totalRatingSum / totalRatingsReceived) * 10) / 10 
      : 0;

    // Get recent activity
    const { data: recentRecipes } = await supabase
      .from('recipes')
      .select('id, title, created_at')
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get this month's recipes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: monthlyRecipes } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.userId)
      .gte('created_at', startOfMonth.toISOString());

    res.json({
      totalRecipes: totalRecipes || 0,
      totalFavorites: totalFavorites || 0,
      totalMealPlans: totalMealPlans || 0,
      totalRatingsReceived,
      avgRating,
      monthlyRecipes: monthlyRecipes || 0,
      recipesByDifficulty: difficultyCounts,
      recipesByCategory: categoryCounts,
      recentRecipes: recentRecipes || []
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get recipe analytics
router.get('/recipes', authenticate, async (req, res) => {
  try {
    const { recipeId } = req.query;

    if (!recipeId) {
      return res.status(400).json({ error: 'recipeId is required' });
    }

    // Check ownership
    const { data: recipe } = await supabase
      .from('recipes')
      .select('user_id')
      .eq('id', recipeId)
      .single();

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    if (recipe.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get ratings for recipe
    const { data: ratings } = await supabase
      .from('recipe_ratings')
      .select('rating, created_at')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });

    // Get favorites count
    const { count: favoritesCount } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('recipe_id', recipeId);

    // Get meal plans count
    const { count: mealPlansCount } = await supabase
      .from('meal_plans')
      .select('*', { count: 'exact', head: true })
      .eq('recipe_id', recipeId);

    const avgRating = ratings?.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    // Rating distribution
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings?.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        ratingDistribution[r.rating]++;
      }
    });

    res.json({
      totalRatings: ratings?.length || 0,
      averageRating: Math.round(avgRating * 10) / 10,
      ratingDistribution,
      favoritesCount: favoritesCount || 0,
      mealPlansCount: mealPlansCount || 0
    });
  } catch (error) {
    console.error('Get recipe analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

