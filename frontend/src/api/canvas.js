const express = require('express');
const router = express.Router();
const Canvas = require('../models/Canvas'); 

router.post('/', async (req, res) => {
  try {
    const canvas = new Canvas(req.body);
    const savedCanvas = await canvas.save();
    res.status(201).json(savedCanvas);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const canvases = await Canvas.find();
    res.json(canvases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.get('/:id', async (req, res) => {
  try {
    const canvas = await Canvas.findById(req.params.id);
    if (!canvas) return res.status(404).json({ message: 'Canvas not found' });
    res.json(canvas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.put('/:id', async (req, res) => {
  try {
    const updatedCanvas = await Canvas.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedCanvas) return res.status(404).json({ message: 'Canvas not found' });
    res.json(updatedCanvas);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedCanvas = await Canvas.findByIdAndDelete(req.params.id);
    if (!deletedCanvas) return res.status(404).json({ message: 'Canvas not found' });
    res.json({ message: 'Canvas deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;