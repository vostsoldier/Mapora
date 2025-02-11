<<<<<<< Updated upstream
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactFlow from 'reactflow';
import 'reactflow/dist/style.css';
import api from './api/apiWrapper';

function Canvas() {
  const { canvasId } = useParams();
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCanvas = async () => {
      try {
        const response = await api.get(`/api/canvas/${canvasId}`);
=======
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import axios from './api/axios';
import api from './api/apiWrapper';
import 'reactflow/dist/style.css';
import './App.css';

function Sidebar({ onAddBox }) {
  return (
    <aside>
      <div className="description">Use the buttons below to add elements:</div>
      <div className="sidebar-buttons">
        <div className="dndnode box-node" onClick={onAddBox}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
          </svg>
          Box
        </div>
      </div>
    </aside>
  );
}

function Canvas() {
  const { canvasId } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeTitle, setNodeTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [authToken, setAuthToken] = useState(localStorage.getItem('token') || '');
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  useEffect(() => {
    const fetchCanvas = async () => {
      try {
        const response = await api.get(`/canvas/${canvasId}`);
>>>>>>> Stashed changes
        setNodes(response.data.nodes);
        setEdges(response.data.edges);
      } catch (error) {
        console.error('Error fetching canvas:', error);
      }
    };
<<<<<<< Updated upstream

    fetchCanvas();
  }, [canvasId]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      />
    </div>
  );
}

export default Canvas;
=======
    if (canvasId) fetchCanvas();
  }, [canvasId, setNodes, setEdges]);
  const handleAddBox = () => {
    const newBox = {
      id: `temp-box-${Date.now()}`,
      type: 'default',
      data: { label: 'New Box', description: 'Click to edit' },
      position: { x: Math.random() * 250, y: Math.random() * 250 },
    };
    setNodes((nds) => [...nds, newBox]);
  };
  const onConnectHandler = useCallback(
    (params) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    },
    [setEdges]
  );
  const saveTree = useCallback(async () => {
    try {
      const payload = {
        nodes: nodes.map((node) => ({
          id: node.id,
          label: node.data.label,
          position: node.position,
          type: node.type,
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          animated: edge.animated,
        })),
      };
      await api.put(`/canvas/${canvasId}`, payload);
      console.log('Canvas saved successfully.');
    } catch (error) {
      console.error('Error saving canvas:', error);
    }
  }, [nodes, edges, canvasId]);

  const addNode = async () => {
    if (!nodeTitle.trim()) {
      alert('Node title cannot be empty.');
      return;
    }

    const newNodeId = `temp-id-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      data: { label: nodeTitle },
      position: { x: Math.random() * 250, y: Math.random() * 250 },
      type: 'default',
    };

    setNodes((nds) => [...nds, newNode]);

    try {
      const response = await axios.post('/api/thinking-trees', {
        title: nodeTitle,
        content: '',
        parentIds: [],
        position: newNode.position,
        type: 'default',
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const createdNode = response.data;
      setNodes((nds) =>
        nds.map((node) =>
          node.id === newNode.id ? { ...node, id: createdNode._id } : node
        )
      );
      setNodeTitle('');
      setIsAdding(false);
      addToast('Node added successfully!', 'success');
    } catch (error) {
      console.error('Error adding node:', error);
      alert('Failed to add node.');
      addToast('Failed to add node.', 'error');
    }
  };
  const handleLogout = () => {
    navigate('/');
  };

  return (
    <ReactFlowProvider>
      <div className="wrapper">
        <Sidebar onAddBox={handleAddBox} />
        <div className="main">
          <header className="App-header">
            <Link to="/" className="page-title">
              <h1>Think Tree</h1>
            </Link>
            <div className="button-container">
              <button className="btn" onClick={addNode}>
                Add Node
              </button>
              <button className="btn" onClick={saveTree}>
                Save Tree
              </button>
              <button className="btn" onClick={() => navigate('/app/new')}>
                New Canvas
              </button>
              <button className="btn cancel" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </header>
          <div className="react-flow-wrapper">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnectHandler}
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

export default Canvas;  
>>>>>>> Stashed changes
