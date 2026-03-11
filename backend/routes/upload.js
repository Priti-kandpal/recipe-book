

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/db');

// Multer memory storage 
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;

    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Authentication middleware
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


// Upload recipe image
router.post('/image', authenticate, upload.single('image'), async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const file = req.file;

    const fileName = `${uuidv4()}-${Date.now()}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(fileName);

    const imageUrl = data.publicUrl;

    res.json({
      message: 'Image uploaded successfully',
      imageUrl: imageUrl,
      path: fileName
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Delete image
router.delete('/image', authenticate, async (req, res) => {
  try {

    const { imagePath } = req.body;

    if (!imagePath) {
      return res.status(400).json({ error: 'Image path is required' });
    }

    const { error } = await supabase.storage
      .from('recipe-images')
      .remove([imagePath]);

    if (error) {
      throw error;
    }

    res.json({ message: 'Image deleted successfully' });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;