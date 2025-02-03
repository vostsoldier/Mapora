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
  description: String,
  nodes: [{
    type: mongoose.Schema.Types.Mixed
  }],
  edges: [{
    type: mongoose.Schema.Types.Mixed
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

CanvasSchema.pre('save', function(next) {
  this.lastModified = Date.now();
  next();
});

CanvasSchema.pre('find', function() {
  console.log('Finding canvases with query:', this.getQuery());
});

module.exports = mongoose.model('Canvas', CanvasSchema);