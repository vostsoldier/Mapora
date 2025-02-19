const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
  canvasId: { type: mongoose.Schema.Types.ObjectId, ref: 'Canvas', required: true },
  inviterId: { type: String, required: true },
  inviteeEmail: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invitation', InvitationSchema);