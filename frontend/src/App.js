// frontend/src/App.js

import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  ReactFlowProvider,
} from 'react-flow-renderer';
import axios from 'axios';
import './App.css';

// Define node types for drag and drop
const nodeTypesList = [
  { type: 'TypeA', label: 'Type A' },
  { type: 'TypeB', label: 'Type B' },
  { type: 'TypeC', label: 'Type C' },
];

// Initial empty states
const initialNodes = [];
const initialEdges = [];

// Sidebar Component for Drag & Drop Node Types
function Sidebar() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside>
      <div className="description">Drag these nodes to the canvas:</div>
      {nodeTypesList.map((node) => (
        <div
          key={node.type}
          className="dndnode"
          onDragStart={(event) => onDragStart(event, node.type)}
          draggable
        >
          {node.label}
        </div>
      ))}
    </aside>
  );
}

function App() {
  // State management using React Flow hooks
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodeTitle, setNodeTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Fetch the tree data from backend on component mount
  useEffect(() => {
    fetchTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to fetch the entire tree from the backend
  const fetchTree = async () => {
    try {
      const response = await axios.get('/api/thinking-trees/full-tree');
      const tree = response.data;
      const flowNodes = [];
      const flowEdges = [];

      const processNode = (node, parent = null) => {
        flowNodes.push({
          id: node._id,
          data: { label: node.title },
          position: node.position || { x: Math.random() * 250, y: Math.random() * 250 },
          type: node.type || 'default',
        });

        if (parent) {
          flowEdges.push({
            id: `e${parent}_to_${node._id}`,
            source: parent,
            target: node._id,
            animated: true,
          });
        }

        node.children.forEach((child) => processNode(child, node._id));
      };

      tree.forEach((rootNode) => processNode(rootNode));

      // If no nodes exist, add a central node
      if (flowNodes.length === 0) {
        addCentralNode(flowNodes, flowEdges);
      } else {
        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    } catch (error) {
      console.error('Error fetching tree:', error);
    }
  };

  // Function to add a central node if the tree is empty
  const addCentralNode = async (flowNodes, flowEdges) => {
    try {
      const response = await axios.post('/api/thinking-trees', {
        title: 'Central Node',
        content: '',
        parentId: null,
        position: { x: 250, y: 250 },
        type: 'central',
      });
      const newNode = response.data;
      flowNodes.push({
        id: newNode._id,
        data: { label: newNode.title },
        position: newNode.position,
        type: newNode.type || 'default',
      });
      setNodes([...flowNodes]);
    } catch (error) {
      console.error('Error adding central node:', error);
    }
  };

  // Handler for connecting nodes (edges)
  const onConnectHandler = (params) => setEdges((eds) => addEdge(params, eds));

  // Handler for removing nodes and edges
  const onElementsRemoveHandler = (elementsToRemove) => {
    const nodesToRemove = elementsToRemove.filter((el) => !el.source);
    const edgesToRemove = elementsToRemove.filter((el) => el.source);

    setNodes((nds) => nds.filter((node) => !nodesToRemove.some((nor) => nor.id === node.id)));
    setEdges((eds) => eds.filter((edge) => !edgesToRemove.some((eor) => eor.id === edge.id)));

    nodesToRemove.forEach(async (node) => {
      try {
        await axios.delete(`/api/thinking-trees/${node.id}`);
      } catch (error) {
        console.error('Error deleting node:', error);
      }
    });
  };

  // Handler for loading React Flow instance
  const onLoadHandler = (rfi) => setReactFlowInstance(rfi);

  // Function to save the current tree state to the backend
  const saveTree = async () => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      const nodesData = flow.nodes.map((node) => ({
        _id: node.id,
        title: node.data.label,
        content: '',
        parent: edges.find((edge) => edge.target === node.id)?.source || null,
        position: node.position,
        type: node.type || 'default',
      }));

      try {
        await axios.put('/api/thinking-trees/bulk-update', {
          nodes: nodesData,
        });
        alert('Tree saved successfully!');
      } catch (error) {
        console.error('Error saving tree:', error);
        alert('Failed to save tree.');
      }
    }
  };

  // Function to add a new node via the modal
  const addNode = async () => {
    if (!nodeTitle.trim()) {
      alert('Node title cannot be empty.');
      return;
    }

    try {
      const response = await axios.post('/api/thinking-trees', {
        title: nodeTitle,
        content: '',
        parentId: null,
        position: { x: Math.random() * 250, y: Math.random() * 250 },
        type: 'default',
      });
      const newNode = response.data;
      setNodes((nds) => [
        ...nds,
        {
          id: newNode._id,
          data: { label: newNode.title },
          position: newNode.position,
          type: newNode.type || 'default',
        },
      ]);
      setNodeTitle('');
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding node:', error);
      alert('Failed to add node.');
    }
  };

  // Handler for dropping a node type onto the canvas
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const reactFlowBounds = document.querySelector('.react-flow-wrapper').getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const nodeTitle = `${type} Node`;

      const newNode = {
        id: `${+new Date()}`,
        type: type === 'central' ? 'central' : 'default',
        position,
        data: { label: nodeTitle },
      };

      setNodes((nds) => nds.concat(newNode));

      // Optionally, connect the new node to the nearest node
      if (nodes.length > 0) {
        const nearestNode = nodes.find(
          (node) =>
            Math.abs(node.position.x - position.x) < 100 &&
            Math.abs(node.position.y - position.y) < 100
        );
        if (nearestNode) {
          const newEdge = {
            id: `e${nearestNode.id}_to_${newNode.id}`,
            source: nearestNode.id,
            target: newNode.id,
            animated: true,
          };
          setEdges((eds) => addEdge(newEdge, eds));
        }
      }
    },
    [nodes, reactFlowInstance]
  );

  // Handler to allow dropping
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <ReactFlowProvider>
      <div className="wrapper">
        <Sidebar />
        <div className="main">
          <header className="App-header">
            <h1>Think Tree</h1>
            <div className="button-container">
              <button className="btn" onClick={() => setIsAdding(true)}>
                Add Node
              </button>
              <button className="btn" onClick={saveTree}>
                Save Tree
              </button>
            </div>
          </header>
          {isAdding && (
            <div className="modal">
              <div className="modal-content">
                <h2>Add New Node</h2>
                <input
                  type="text"
                  value={nodeTitle}
                  onChange={(e) => setNodeTitle(e.target.value)}
                  placeholder="Enter node title"
                />
                <div className="modal-actions">
                  <button className="btn" onClick={addNode}>
                    Add
                  </button>
                  <button className="btn cancel" onClick={() => setIsAdding(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          <div
            className="react-flow-wrapper"
            onDrop={onDrop}
            onDragOver={onDragOver}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnectHandler}
              onElementsRemove={onElementsRemoveHandler}
              onLoad={onLoadHandler}
              deleteKeyCode={46} /* 'delete'-key */
              snapToGrid={true}
              snapGrid={[15, 15]}
              fitView
            >
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default App;