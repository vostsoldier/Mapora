const express = require('express');
const router = express.Router();
const ThinkTreeNode = require('../models/ThinkTreeNode');
const ThinkTreeEdge = require('../models/ThinkTreeEdge');
router.post('/', async (req, res) => {
  const { title, content, parentIds, position, type } = req.body; 

  try {
    const newNode = new ThinkTreeNode({
      title,
      content,
      parents: parentIds || [],
      position: position || { x: 0, y: 0 },
      type: type || 'default',
    });

    const savedNode = await newNode.save();
    if (parentIds && parentIds.length > 0) {
      for (const parentId of parentIds) {
        const parentNode = await ThinkTreeNode.findById(parentId);
        if (parentNode) {
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
      }
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
      node.parents.forEach(parentId => {
        if (parentId) {
          nodeMap[parentId].children.push(node);
        }
      });
      if (node.parents.length === 0) {
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
          parents: Array.isArray(node.parents) 
            ? node.parents.filter(parent => parent !== null) 
            : [], 
          position: node.position || { x: 0, y: 0 },
          type: node.type || 'default',
        },
      },
    }));

    await ThinkTreeNode.bulkWrite(bulkOperations);
    console.log('Parents fields updated successfully.');

    await ThinkTreeNode.updateMany({}, { children: [] });
    console.log('Children arrays reset.');

    const allNodes = await ThinkTreeNode.find().select('_id parents').lean();
    const parentChildrenMap = {};

    allNodes.forEach((node) => {
      (node.parents || []).forEach(parentId => {
        if (parentId) {
          if (!parentChildrenMap[parentId]) {
            parentChildrenMap[parentId] = [];
          }
          parentChildrenMap[parentId].push(node._id);
        }
      });
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

    if (parentId) {
      if (!node.parents.includes(parentId)) {
        node.parents.push(parentId);
        await node.save();
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
    } else {
      for (const existingParentId of node.parents) {
        await ThinkTreeNode.findByIdAndUpdate(existingParentId, {
          $pull: { children: node._id },
        });
        await ThinkTreeEdge.findOneAndDelete({
          source: existingParentId,
          target: node._id,
        });
      }
      node.parents = [];
      await node.save();
    }

    res.json({ message: 'Parents updated successfully', node });
  } catch (err) {
    console.error('Error updating parents:', err);
    res.status(500).json({ message: 'Server error updating parents' });
  }
});
router.put('/edges/:id/remove-parent', async (req, res) => {
  const { parentId } = req.body;

  try {
    const edge = await ThinkTreeEdge.findById(req.params.id);
    if (!edge) {
      return res.status(404).json({ message: 'Edge not found' });
    }
    await ThinkTreeNode.findByIdAndUpdate(edge.target, {
      $pull: { parents: parentId },
    });
    await ThinkTreeEdge.findByIdAndDelete(req.params.id);
    await ThinkTreeNode.findByIdAndUpdate(parentId, {
      $pull: { children: edge.target },
    });

    res.json({ message: 'Parent removed and edge deleted successfully' });
  } catch (err) {
    console.error('Error removing parent:', err);
    res.status(500).json({ message: 'Server error removing parent' });
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
      if (node.parents && node.parents.length > 0) {
        for (const parentId of node.parents) {
          await ThinkTreeNode.findByIdAndUpdate(parentId, {
            $pull: { children: node._id },
          });
          await ThinkTreeEdge.findOneAndDelete({
            source: parentId,
            target: node._id,
          });
        }
      }
      await ThinkTreeNode.findByIdAndDelete(nodeId);
    };

    await deleteNodeAndChildren(req.params.id);
    res.json({ message: 'Node and its children deleted successfully.' });
  } catch (err) {
    console.error('Error deleting node:', err);
    res.status(500).json({ message: 'Failed to delete node.' });
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