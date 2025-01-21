const mongoose = require('mongoose');

const ThinkTreeEdgeSchema = new mongoose.Schema({
  source: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ThinkTreeNode',
    required: true,
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ThinkTreeNode',
    required: true,
  },
  reverseAnimated: {
    type: Boolean,
    default: false,
  },
  animated: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ThinkTreeEdge', ThinkTreeEdgeSchema);