const express = require('express');
const router = express.Router();
const Invitation = require('../models/Invitation');
const Canvas = require('../models/Canvas');
const authenticateToken = require('../middleware/auth');
router.post('/', authenticateToken, async (req, res) => {
  const { canvasId, inviteeEmail } = req.body;
  try {
    if (!canvasId || !inviteeEmail) {
      return res.status(400).json({ message: 'Canvas ID and invitee email are required.' });
    }
    const canvas = await Canvas.findById(canvasId);
    if (!canvas) return res.status(404).json({ message: 'Canvas not found' });
    if (canvas.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ message: 'Access forbidden' });
    }
    const normalizedEmail = inviteeEmail.toLowerCase().trim();

    const invitation = new Invitation({
      canvasId,
      inviterId: req.user.userId,
      inviteeEmail: normalizedEmail,
    });

    await invitation.save();
    res.status(201).json({ message: 'Invitation sent.', invitation });
  } catch (err) {
    console.error('Error sending invitation:', err);
    res.status(500).json({ message: 'Error sending invitation' });
  }
});
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (!req.user.email) {
      console.error('Authenticated token is missing email.');
      return res.status(400).json({ message: 'User email not found in token' });
    }
    const normalizedEmail = req.user.email.toLowerCase().trim();
    const invitations = await Invitation.find({
      inviteeEmail: normalizedEmail,
      status: 'pending'
    });
    res.json(invitations);
  } catch (err) {
    console.error('Error loading invitations:', err);
    res.status(500).json({ message: 'Error loading invitations' });
  }
});
router.put('/:invitationId/accept', authenticateToken, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.invitationId);
    if (!invitation) return res.status(404).json({ message: 'Invitation not found' });
    if (invitation.inviteeEmail !== req.user.email) {
      return res.status(403).json({ message: 'Access forbidden' });
    }
    invitation.status = 'accepted';
    await invitation.save();
    res.json({ message: 'Invitation accepted.', invitation });
  } catch (err) {
    console.error('Error accepting invitation:', err);
    res.status(500).json({ message: 'Error accepting invitation' });
  }
});
router.delete('/:invitationId', authenticateToken, async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.invitationId);
    if (!invitation) return res.status(404).json({ message: 'Invitation not found' });
    if (invitation.inviteeEmail !== req.user.email) {
      return res.status(403).json({ message: 'Access forbidden' });
    }
    invitation.status = 'rejected';
    await invitation.save();
    res.json({ message: 'Invitation rejected.', invitation });
  } catch (err) {
    console.error('Error rejecting invitation:', err);
    res.status(500).json({ message: 'Error rejecting invitation' });
  }
});

module.exports = router;