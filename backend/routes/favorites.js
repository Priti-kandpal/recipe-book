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

// Get user's favorites
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        recipe:recipes(
          id, title, description, image_url, prep_time, cook_time, difficulty,
          category:categories(name, slug, icon, color),
          user:users(id, full_name, avatar_url),
          ratings:recipe_ratings(rating)
        )
      `)
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Calculate avg rating for each recipe
    const favoritesWithRating = data.map(fav => {
      const recipe = fav.recipe;
      const ratings = recipe?.ratings || [];
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;
      return { ...fav, recipe: { ...recipe, avgRating: Math.round(avgRating * 10) / 10 } };
    });

    res.json(favoritesWithRating);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add to favorites
router.post('/', authenticate, async (req, res) => {
  try {
    const { recipeId } = req.body;

    if (!recipeId) {
      return res.status(400).json({ error: 'recipeId is required' });
    }

    // Check if recipe exists
    const { data: recipe } = await supabase
      .from('recipes')
      .select('id')
      .eq('id', recipeId)
      .single();

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from('favorites')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('user_id', req.userId)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Recipe already in favorites' });
    }

    const { data, error } = await supabase
      .from('favorites')
      .insert([{
        user_id: req.userId,
        recipe_id: recipeId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Recipe added to favorites',
      favorite: data
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove from favorites
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const { data: existing } = await supabase
      .from('favorites')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    if (existing.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to remove this favorite' });
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Recipe removed from favorites' });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if recipe is favorited
router.get('/check/:recipeId', authenticate, async (req, res) => {
  try {
    const { recipeId } = req.params;

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('recipe_id', recipeId)
      .eq('user_id', req.userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(400).json({ error: error.message });
    }

    res.json({ isFavorite: !!data });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

