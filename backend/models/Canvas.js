const mongoose = require('mongoose');

const CanvasSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  nodes: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  edges: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Canvas', CanvasSchema);