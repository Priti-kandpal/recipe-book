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

// Get all recipes (with filters)
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 20, offset = 0 } = req.query;
    
    let query = supabase
      .from('recipes')
      .select(`
        *,
        category:categories(name, slug, icon, color),
        user:users(full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // if (category) {
    //   query = query.eq('category.slug', category);
    // }
    if (category) {
    const { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', category)
    .single();

    if (cat) {
    query = query.eq('category_id', cat.id);
   }
   }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single recipe
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: recipe, error } = await supabase
      .from('recipes')
      .select(`
        *,
        category:categories(name, slug, icon, color),
        user:users(id, full_name, avatar_url),
        ratings:recipe_ratings(
          id, rating, review, created_at,
          user:users(id, full_name, avatar_url)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Calculate average rating
    const ratings = recipe.ratings || [];
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

    res.json({
      ...recipe,
      avgRating: Math.round(avgRating * 10) / 10,
      totalRatings: ratings.length
    });
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create recipe
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      instructions,
      ingredients,
      prepTime,
      cookTime,
      servings,
      imageUrl,
      categoryId,
      isPublic
    } = req.body;

    const { data, error } = await supabase
      .from('recipes')
      .insert([{
        title,
        description,
        instructions: JSON.stringify(instructions),
        ingredients: JSON.stringify(ingredients),
        prep_time: prepTime,
        cook_time: cookTime,
        servings,
        image_url: imageUrl,
        user_id: req.userId,
        category_id: categoryId,
        is_public: isPublic || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({
      message: 'Recipe created successfully',
      recipe: {
        ...data,
        instructions: instructions,
        ingredients: ingredients
      }
    });
  } catch (error) {
    console.error('Create recipe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update recipe
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      instructions,
      ingredients,
      prepTime,
      cookTime,
      servings,
      imageUrl,
      categoryId,
      isPublic
    } = req.body;

    // Check ownership
    const { data: existing } = await supabase
      .from('recipes')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    if (existing.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to update this recipe' });
    }

    const { data, error } = await supabase
      .from('recipes')
      .update({
        title,
        description,
        instructions: JSON.stringify(instructions),
        ingredients: JSON.stringify(ingredients),
        prep_time: prepTime,
        cook_time: cookTime,
        servings,
        image_url: imageUrl,
        category_id: categoryId,
        is_public: isPublic,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      message: 'Recipe updated successfully',
      recipe: {
        ...data,
        instructions: instructions,
        ingredients: ingredients
      }
    });
  } catch (error) {
    console.error('Update recipe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete recipe
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const { data: existing } = await supabase
      .from('recipes')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    if (existing.user_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this recipe' });
    }

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search recipes by ingredient
router.get('/search/ingredients', async (req, res) => {
  try {
    const { ingredient } = req.query;

    if (!ingredient) {
      return res.status(400).json({ error: 'Ingredient query required' });
    }

    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        category:categories(name, slug),
        user:users(full_name, avatar_url),
        ratings:recipe_ratings(rating)
      `)
      .eq('is_public', true);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Filter by ingredient in client side (PostgreSQL JSON search is complex)
    const recipesWithIngredient = data.filter(recipe => {
      const ingredients = JSON.parse(recipe.ingredients || '[]');
      return ingredients.some(ing => 
        ing.name.toLowerCase().includes(ingredient.toLowerCase())
      );
    }).map(recipe => {
      const ratings = recipe.ratings || [];
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;
      return { ...recipe, avgRating: Math.round(avgRating * 10) / 10 };
    });

    res.json(recipesWithIngredient);
  } catch (error) {
    console.error('Search recipes error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's recipes
router.get('/user/my-recipes', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        category:categories(name, slug, icon, color),
        ratings:recipe_ratings(rating)
      `)
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const recipesWithAvgRating = data.map(recipe => {
      const ratings = recipe.ratings || [];
      const avgRating = ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
        : 0;
      return { ...recipe, avgRating: Math.round(avgRating * 10) / 10, totalRatings: ratings.length };
    });

    res.json(recipesWithAvgRating);
  } catch (error) {
    console.error('Get user recipes error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

