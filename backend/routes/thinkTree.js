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

// Get the entire Think Tree
router.get('/full-tree', async (req, res) => {
  try {
    const nodes = await ThinkTreeNode.find().lean();

    // Convert flat list to tree
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

// Delete a Think Tree node and its descendants
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

module.exports = router;