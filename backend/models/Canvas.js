const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  label: { type: String, default: '' },
  text: { type: String, default: '' },
  position: { type: Object, required: true },
  style: { type: Object, default: {} },
  data: { type: Object, default: {} }
}, { _id: false });

const EdgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  animated: { type: Boolean, default: false },
  reverseAnimated: { type: Boolean, default: false },
  data: { type: Object, default: {} },
  style: { type: Object, default: {} }
}, { _id: false });

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
    type: [NodeSchema],
    default: []
  },
  edges: {
    type: [EdgeSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Canvas', CanvasSchema);