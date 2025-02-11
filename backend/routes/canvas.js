const express = require('express');
<<<<<<< Updated upstream
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
=======
const jwt = require('jsonwebtoken');
const router = express.Router();
const Canvas = require('../models/Canvas');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

router.get('/', async (req, res) => {
  try {
    const canvases = await Canvas.find().lean();
    res.json(canvases);
  } catch (error) {
    console.error('Error fetching canvases:', error);
    res.status(500).json({ message: 'Error fetching canvases' });
  }
});
router.get('/:canvasId', (req, res) => {
  const { canvasId } = req.params;
  res.json({ canvasId, data: "Dummy canvas data" });
});
router.post('/', (req, res) => {
  const newCanvas = {
    canvasId: Date.now().toString(),
    data: req.body || {}
  };
  res.status(201).json(newCanvas);
});
>>>>>>> Stashed changes

module.exports = router;