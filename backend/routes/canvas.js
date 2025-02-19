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
    if (!canvas) {
      console.log('Canvas not found');
      return res.status(404).json({ message: 'Canvas not found' });
    }
    console.log('Canvas.userId:', canvas.userId.toString());
    console.log('req.user:', req.user);
    if (canvas.userId.toString() === req.user.userId.toString()) {
      console.log('User is the owner');
      return res.json(canvas);
    }
    const normalizedEmail = req.user.email ? req.user.email.toLowerCase().trim() : "";
    console.log('Normalized email from token:', normalizedEmail);
    const Invitation = require('../models/Invitation');
    const invitation = await Invitation.findOne({
      canvasId: canvas._id,
      inviteeEmail: normalizedEmail,
      status: 'accepted'
    });
    
    if (!invitation) {
      console.log('No accepted invitation found for email:', normalizedEmail);
      return res.status(403).json({ message: 'Access forbidden' });
    }
    
    res.json(canvas);
  } catch (error) {
    console.error('Error fetching canvas:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Canvas name is required' });
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
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const canvas = await Canvas.findById(req.params.id);
    if (!canvas) return res.status(404).json({ message: 'Canvas not found' });
    if (canvas.userId.toString() !== req.user.userId.toString()) {
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
    }
    
    const updatedCanvas = await Canvas.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedCanvas);
    const io = req.app.locals.io;
    io.to(updatedCanvas._id.toString()).emit('canvasUpdated', updatedCanvas);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const canvas = await Canvas.findById(req.params.id);
    if (!canvas) return res.status(404).json({ message: 'Canvas not found' });
    if (canvas.userId !== req.user.userId) { 
      return res.status(403).json({ message: 'Access forbidden' });
    }
    const deletedCanvas = await Canvas.findByIdAndDelete(req.params.id);
    if (!deletedCanvas) return res.status(404).json({ message: 'Canvas not found' });
    res.json({ message: 'Canvas deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;