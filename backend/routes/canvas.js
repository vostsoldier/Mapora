const express = require('express');
const router = express.Router();
const Canvas = require('../models/Canvas');
const authenticateToken = require('../middleware/auth');

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const canvas = new Canvas({
      userId: req.user.userId,
      name,
      description
    });
    await canvas.save();
    res.status(201).json(canvas);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const canvases = await Canvas.find({ userId: req.user.userId });
    res.json(canvases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;