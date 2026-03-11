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

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Get recipe count for each category
    const categoriesWithCount = await Promise.all(
      data.map(async (category) => {
        const { count } = await supabase
          .from('recipes')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id);
        
        return { ...category, recipeCount: count || 0 };
      })
    );

    res.json(categoriesWithCount);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create category
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, slug, icon, color } = req.body;

    // Check if category already exists
    const { data: existing } = await supabase
      .from('categories')
      .select('*')
      .or(`name.ilike.${name},slug.ilike.${slug}`)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([{
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        icon: icon || '🍽️',
        color: color || '#f97316',
        user_id: req.userId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Category created successfully',
      category: data
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update category
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, icon, color } = req.body;

    // Check ownership
    const { data: existing } = await supabase
      .from('categories')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (existing.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to update this category' });
    }

    const { data, error } = await supabase
      .from('categories')
      .update({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        icon,
        color
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Category updated successfully',
      category: data
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete category
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const { data: existing } = await supabase
      .from('categories')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (existing.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this category' });
    }

    // Check if category has recipes
    const { count } = await supabase
      .from('recipes')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing recipes. Move or delete recipes first.' 
      });
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

