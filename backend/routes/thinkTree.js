const express = require('express');
const router = express.Router();
const ThinkTreeNode = require('../models/ThinkTreeNode');
const ThinkTreeEdge = require('../models/ThinkTreeEdge');
router.post('/', async (req, res) => {
  const { title, content, parentId, position, type } = req.body;

  try {
    const newNode = new ThinkTreeNode({
      title,
      content,
      parent: parentId || null,
      position: position || { x: 0, y: 0 },
      type: type || 'default',
    });

    const savedNode = await newNode.save();

    if (parentId) {
      const parentNode = await ThinkTreeNode.findById(parentId);
      parentNode.children.push(savedNode._id);
      await parentNode.save();
      const newEdge = new ThinkTreeEdge({
        source: parentId,
        target: savedNode._id,
        reverseAnimated: false,
        animated: true,
      });

      await newEdge.save();
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

    const edges = await ThinkTreeEdge.find().lean();

    res.json({ tree, edges });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put('/bulk-update', async (req, res) => {
  const { nodes } = req.body;

  try {
    const bulkOperations = nodes.map((node) => ({
      updateOne: {
        filter: { _id: node._id },
        update: {
          title: node.title,
          content: node.content,
          parent: node.parent || null,
          position: node.position || { x: 0, y: 0 },
          type: node.type || 'default',
        },
      },
    }));

    await ThinkTreeNode.bulkWrite(bulkOperations);
    console.log('Parent fields updated successfully.');

    await ThinkTreeNode.updateMany({}, { children: [] });
    console.log('Children arrays reset.');

    const allNodes = await ThinkTreeNode.find().select('_id parent').lean();
    const parentChildrenMap = {};

    allNodes.forEach((node) => {
      if (node.parent) {
        if (!parentChildrenMap[node.parent]) {
          parentChildrenMap[node.parent] = [];
        }
        parentChildrenMap[node.parent].push(node._id);
      }
    });

    const childUpdateOperations = Object.entries(parentChildrenMap).map(
      ([parentId, children]) => ({
        updateOne: {
          filter: { _id: parentId },
          update: { children: children },
        },
      })
    );

    if (childUpdateOperations.length > 0) {
      await ThinkTreeNode.bulkWrite(childUpdateOperations);
      console.log('Children fields updated based on parent relationships.');
    }

    res.json({ message: 'Nodes and their relationships updated successfully.' });
  } catch (err) {
    console.error('Error in bulk-update:', err);
    res.status(400).json({ message: err.message });
  }
});
router.put('/:id/parent', async (req, res) => {
  const { parentId } = req.body;

  try {
    const node = await ThinkTreeNode.findById(req.params.id);
    if (!node) {
      return res.status(404).json({ message: 'Node not found' });
    }

    if (node.parent) {
      await ThinkTreeNode.findByIdAndUpdate(node.parent, {
        $pull: { children: node._id },
      });
      await ThinkTreeEdge.findOneAndDelete({
        source: node.parent,
        target: node._id,
      });
    }

    node.parent = parentId || null;
    await node.save();

    if (parentId) {
      await ThinkTreeNode.findByIdAndUpdate(parentId, {
        $addToSet: { children: node._id },
      });
      const newEdge = new ThinkTreeEdge({
        source: parentId,
        target: node._id,
        reverseAnimated: false,
        animated: true,
      });

      await newEdge.save();
    }

    res.json({ message: 'Parent updated successfully', node });
  } catch (err) {
    console.error('Error updating parent:', err);
    res.status(500).json({ message: 'Server error updating parent' });
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
router.delete('/:id', async (req, res) => {
  try {
    const deleteNodeAndChildren = async (nodeId) => {
      const node = await ThinkTreeNode.findById(nodeId);
      if (!node) return;
      await ThinkTreeEdge.deleteMany({ source: nodeId });
      await ThinkTreeEdge.deleteMany({ target: nodeId });

      for (const childId of node.children) {
        await deleteNodeAndChildren(childId);
      }

      if (node.parent) {
        await ThinkTreeNode.findByIdAndUpdate(node.parent, {
          $pull: { children: node._id },
        });
        await ThinkTreeEdge.findOneAndDelete({
          source: node.parent,
          target: node._id,
        });
      }

      await ThinkTreeNode.findByIdAndDelete(nodeId);
    };

    await deleteNodeAndChildren(req.params.id);
    res.json({ message: 'Node and its children deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.put('/edges/:id/reverse-animation', async (req, res) => {
  const { reverseAnimated } = req.body;

  try {
    const updatedEdge = await ThinkTreeEdge.findByIdAndUpdate(
      req.params.id,
      { reverseAnimated },
      { new: true }
    );

    if (!updatedEdge) {
      return res.status(404).json({ message: 'Edge not found' });
    }

    res.json(updatedEdge);
  } catch (err) {
    console.error('Error reversing edge animation:', err);
    res.status(500).json({ message: 'Server error reversing edge animation' });
  }
});

module.exports = router;