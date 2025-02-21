const express = require('express');
const router = express.Router();
const Canvas = require('../models/Canvas');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const ownCanvases = await Canvas.find({ userId: req.user.userId });
    const normalizedEmail = req.user.email.toLowerCase().trim();
    const Invitation = require('../models/Invitation');
    const acceptedInvitations = await Invitation.find({
      inviteeEmail: normalizedEmail,
      status: 'accepted'
    });
    const sharedCanvasIds = acceptedInvitations.map(inv => inv.canvasId);
    const sharedCanvases = await Canvas.find({
      _id: { $in: sharedCanvasIds }
    });
    const canvasesMap = {};
    [...ownCanvases, ...sharedCanvases].forEach(canvas => {
      canvasesMap[canvas._id] = canvas;
    });
    const canvases = Object.values(canvasesMap);
    
    res.json(canvases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const canvas = await Canvas.findById(req.params.id);
    if (!canvas) return res.status(404).json({ message: 'Canvas not found' });
    if (canvas.userId.toString() === req.user.userId.toString()) {
      return res.json(canvas);
    }
    const normalizedEmail = req.user.email.toLowerCase().trim();
    const Invitation = require('../models/Invitation');
    const invitation = await Invitation.findOne({
      canvasId: canvas._id,
      inviteeEmail: normalizedEmail,
      status: 'accepted'
    });
    if (!invitation) {
      return res.status(403).json({ message: 'Access forbidden' });
    }
    res.json(canvas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const existingCount = await Canvas.countDocuments({ userId });
    if (existingCount >= 3) {
      return res.status(403).json({ message: 'Free plan limit reached: Only 3 canvases allowed.' });
    }
    
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Canvas name is required' });
    }
    
    const canvas = new Canvas({
      userId,
      name,
      description: description || '',
      nodes: [],
      edges: []
    });

    const savedCanvas = await canvas.save();
    res.status(201).json(savedCanvas);
  } catch (error) {
    console.error('Error creating canvas:', error);
    res.status(500).json({ message: 'Server error creating canvas' });
  }
});
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const canvas = await Canvas.findById(req.params.id);
    if (!canvas) {
      return res.status(404).json({ message: 'Canvas not found' });
    }

    const nodes = req.body.nodes || [];
    const edges = req.body.edges || [];
    const totalModels = nodes.length + edges.length;

    if (totalModels > 75) {
      return res.status(403).json({
        message: 'Free plan limit exceeded: Only 75 models allowed per canvas.'
      });
    }

    canvas.nodes = nodes;
    canvas.edges = edges;

    const updatedCanvas = await canvas.save();
    res.json(updatedCanvas);
  } catch (error) {
    console.error('Error saving canvas:', error);
    res.status(500).json({ message: 'Server error saving canvas' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const canvas = await Canvas.findById(req.params.id);
    if (!canvas) {
      return res.status(404).json({ message: 'Canvas not found' });
    }
    if (canvas.userId.toString() === req.user.userId.toString()) {
      await canvas.deleteOne();
      return res.json({ message: 'Canvas deleted successfully' });
    } else {
      const Invitation = require('../models/Invitation');
      const normalizedEmail = req.user.email.toLowerCase().trim();
      const invitation = await Invitation.findOneAndUpdate(
        {
          canvasId: canvas._id,
          inviteeEmail: normalizedEmail,
          status: 'accepted'
        },
        { status: 'removed' },
        { new: true }
      );
      if (invitation) {
        return res.json({ message: 'Canvas removed from your list' });
      } else {
        return res.status(403).json({ message: 'Access forbidden' });
      }
    }
  } catch (error) {
    console.error('Error deleting canvas:', error);
    res.status(500).json({ message: 'Server error deleting canvas' });
  }
});

module.exports = router;