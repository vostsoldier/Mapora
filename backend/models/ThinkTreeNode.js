const mongoose = require('mongoose');

const ThinkTreeNodeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
  },
  children: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ThinkTreeNode',
    },
  ],
  parents: [ 
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ThinkTreeNode',
      default: [], 
    },
  ],
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
  },
  type: {
    type: String,
    default: 'default',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

ThinkTreeNodeSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ThinkTreeNode', ThinkTreeNodeSchema);