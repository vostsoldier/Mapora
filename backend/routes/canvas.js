const express = require('express');
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

module.exports = router;