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

// Get user's meal plans
router.get('/', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('meal_plans')
      .select(`
        *,
        recipe:recipes(
          id, title, image_url, prep_time, cook_time, difficulty
        )
      `)
      .eq('user_id', req.userId);

    if (startDate) {
      query = query.gte('planned_date', startDate);
    }

    if (endDate) {
      query = query.lte('planned_date', endDate);
    }

    const { data, error } = await query.order('planned_date', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error) {
    console.error('Get meal plans error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add recipe to meal plan
router.post('/', authenticate, async (req, res) => {
  try {
    const { recipeId, plannedDate, mealType } = req.body;

    if (!recipeId || !plannedDate || !mealType) {
      return res.status(400).json({ error: 'recipeId, plannedDate, and mealType are required' });
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

    const { data, error } = await supabase
      .from('meal_plans')
      .insert([{
        user_id: req.userId,
        recipe_id: recipeId,
        planned_date: plannedDate,
        meal_type: mealType,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Get full recipe data
    const { data: fullRecipe } = await supabase
      .from('recipes')
      .select('id, title, image_url, prep_time, cook_time, difficulty')
      .eq('id', recipeId)
      .single();

    res.status(201).json({
      message: 'Recipe added to meal plan',
      mealPlan: { ...data, recipe: fullRecipe }
    });
  } catch (error) {
    console.error('Add to meal plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update meal plan
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { plannedDate, mealType } = req.body;

    // Check ownership
    const { data: existing } = await supabase
      .from('meal_plans')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    if (existing.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to update this meal plan' });
    }

    const { data, error } = await supabase
      .from('meal_plans')
      .update({
        planned_date: plannedDate,
        meal_type: mealType
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Meal plan updated successfully',
      mealPlan: data
    });
  } catch (error) {
    console.error('Update meal plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete meal plan
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const { data: existing } = await supabase
      .from('meal_plans')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Meal plan not found' });
    }

    if (existing.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this meal plan' });
    }

    const { error } = await supabase
      .from('meal_plans')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Meal plan deleted successfully' });
  } catch (error) {
    console.error('Delete meal plan error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

