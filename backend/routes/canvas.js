const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Canvas = require('../models/Canvas');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Canvas name is required' });
    }

    const canvas = new Canvas({
      userId: req.user.userId,
      name,
      description: description || '',
      nodes: [],
      edges: []
    });

    const savedCanvas = await canvas.save();
    res.status(201).json(savedCanvas);
  } catch (error) {
    console.error('Error creating canvas:', error);
    res.status(500).json({ 
      message: 'Error creating canvas',
      error: error.message 
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const canvases = await Canvas.find();
    res.json(canvases);
  } catch (error) {
    console.error("Error fetching canvases:", error);
    res.status(500).json({ message: "Internal server error fetching canvases" });
  }
});

module.exports = router;