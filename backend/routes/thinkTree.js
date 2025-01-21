const express = require('express');
const router = express.Router();
const ThinkTreeNode = require('../models/ThinkTreeNode');


router.post('/', async (req, res) => {
  const { title, content, parentId, position } = req.body;

  try {
    const newNode = new ThinkTreeNode({
      title,
      content,
      parent: parentId || null,
      position: position || { x: 0, y: 0 },
    });

    const savedNode = await newNode.save();


    if (parentId) {
      const parentNode = await ThinkTreeNode.findById(parentId);
      parentNode.children.push(savedNode._id);
      await parentNode.save();
    }

    res.status(201).json(savedNode);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/full-tree', async (req, res) => {
  try {
    const nodes = await ThinkTreeNode.find().lean();

    const nodeMap = {};
    nodes.forEach(node => {
      node.children = [];
      nodeMap[node._id] = node;
    });

    const tree = [];

    nodes.forEach(node => {
      if (node.parent) {
        nodeMap[node.parent].children.push(node);
      } else {
        tree.push(node);
      }
    });

    res.json(tree);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/bulk-update', async (req, res) => {
  const { nodes } = req.body;

  try {
    const bulkOperations = nodes.map(node => ({
      updateOne: {
        filter: { _id: node._id },
        update: { 
          title: node.title,
          content: node.content,
          parent: node.parent || null,
          position: node.position || { x: 0, y: 0 },
        },
      },
    }));

    await ThinkTreeNode.bulkWrite(bulkOperations);
    res.json({ message: 'Nodes updated successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleteNodeAndChildren = async (nodeId) => {
      const node = await ThinkTreeNode.findById(nodeId);
      if (!node) return;

      for (const childId of node.children) {
        await deleteNodeAndChildren(childId);
      }

      await ThinkTreeNode.findByIdAndDelete(nodeId);
    };

    await deleteNodeAndChildren(req.params.id);
    res.json({ message: 'Node and its children deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/position', async (req, res) => {
  const { x, y } = req.body;

  if (typeof x !== 'number' || typeof y !== 'number') {
    return res.status(400).json({ message: 'Invalid position data' });
  }

  try {
    const updatedNode = await ThinkTreeNode.findByIdAndUpdate(
      req.params.id,
      { position: { x, y } },
      { new: true }
    );

    if (!updatedNode) {
      return res.status(404).json({ message: 'Node not found' });
    }

    res.json(updatedNode);
  } catch (err) {
    console.error('Error updating node position:', err);
    res.status(500).json({ message: 'Server error updating position' });
  }
});

router.put('/:id/title', async (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ message: 'Invalid title data' });
  }

  try {
    const updatedNode = await ThinkTreeNode.findByIdAndUpdate(
      req.params.id,
      { title },
      { new: true }
    );

    if (!updatedNode) {
      return res.status(404).json({ message: 'Node not found' });
    }

    res.json(updatedNode);
  } catch (err) {
    console.error('Error updating node title:', err);
    res.status(500).json({ message: 'Server error updating title' });
  }
});

module.exports = router;