const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const Canvas = require('../models/Canvas');
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Canvas name is required.' });
    }
    const canvas = new Canvas({
      userId: req.user.userId,
      name,
      description
    });
    await canvas.save();
    res.status(201).json(canvas);
  } catch (err) {
    console.error('Error creating canvas:', err);
    res.status(500).json({ message: err.message });
  }
});
router.get('/', authenticateToken, async (req, res) => {
  try {
    const canvases = await Canvas.find({ userId: req.user.userId }).lean();
    res.json(canvases);

  } catch (err) {
    console.error('Error fetching canvases:', err);
    res.status(500).json({ message: 'Failed to fetch canvases' });
  }
});

module.exports = router;