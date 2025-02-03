const express = require('express');
const router = express.Router();
let canvases = [];
router.get('/', async (req, res) => {
  try {
    res.json({ canvases });
  } catch (error) {
    console.error('Error fetching canvases:', error);
    res.status(500).json({ message: 'Error fetching canvases' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    const newCanvas = { id: Date.now().toString(), title };
    canvases.push(newCanvas);
    res.status(201).json({ canvas: newCanvas });
  } catch (error) {
    console.error('Error creating canvas:', error);
    res.status(500).json({ message: 'Error creating canvas' });
  }
});

module.exports = router;