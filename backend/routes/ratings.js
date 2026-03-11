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

// Add rating to recipe
router.post('/:recipeId', authenticate, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
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

    // Check if user already rated
    const { data: existing } = await supabase
      .from('recipe_ratings')
      .select('*')
      .eq('recipe_id', recipeId)
      .eq('user_id', req.userId)
      .single();

    if (existing) {
      // Update existing rating
      const { data, error } = await supabase
        .from('recipe_ratings')
        .update({
          rating,
          review,
          created_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.json({
        message: 'Rating updated successfully',
        rating: data
      });
    }

    // Create new rating
    const { data, error } = await supabase
      .from('recipe_ratings')
      .insert([{
        recipe_id: recipeId,
        user_id: req.userId,
        rating,
        review,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Rating added successfully',
      rating: data
    });
  } catch (error) {
    console.error('Add rating error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get ratings for a recipe
router.get('/:recipeId', async (req, res) => {
  try {
    const { recipeId } = req.params;

    const { data, error } = await supabase
      .from('recipe_ratings')
      .select(`
        *,
        user:users(id, full_name, avatar_url)
      `)
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Calculate average
    const avgRating = data.length > 0
      ? data.reduce((sum, r) => sum + r.rating, 0) / data.length
      : 0;

    res.json({
      ratings: data,
      averageRating: Math.round(avgRating * 10) / 10,
      totalRatings: data.length
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete rating
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const { data: existing } = await supabase
      .from('recipe_ratings')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Rating not found' });
    }

    if (existing.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this rating' });
    }

    const { error } = await supabase
      .from('recipe_ratings')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Rating deleted successfully' });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

