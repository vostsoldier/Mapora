import 'reactflow/dist/style.css';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  ReactFlowProvider,
  Handle,  
} from 'reactflow';
import axios from './api/axios';
import './App.css';
import debounce from 'lodash.debounce';
import Home from './Home';
import Signup from './Signup'; 
import Login from './Login'; 
import Features from './Features';
import About from './About';
import Members from './Members';
import Canvas from './Canvas';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import api from './api/apiWrapper'; 
import { motion, AnimatePresence } from 'framer-motion';
import Toast from './components/Toast';
import Pricing from './Pricing';
const COLOR_PRESETS = [
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Gray', value: '#9CA3AF' }, 
];
const Box = ({ data, id, setNodes, nodes }) => { 
  const [dimensions, setDimensions] = useState({
    width: data.width || 150,
    height: data.height || 100
  });

  const handleResize = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    
    const targetElement = e.target;
    targetElement.setPointerCapture(e.pointerId);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;

    const handlePointerMove = (moveEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();

      let newDimensions = { ...dimensions };

      if (direction.includes('right')) {
        const dx = moveEvent.clientX - startX;
        newDimensions.width = Math.max(50, startWidth + dx);
      }
      
      if (direction.includes('bottom')) {
        const dy = moveEvent.clientY - startY;
        newDimensions.height = Math.max(50, startHeight + dy);
      }

      setDimensions(newDimensions);
      const updatedNodes = nodes.map(node => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              width: newDimensions.width,
              height: newDimensions.height
            }
          };
        }
        return node;
      });

      setNodes(updatedNodes);
    };

    const handlePointerUp = () => {
      targetElement.releasePointerCapture(e.pointerId);
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div
      style={{
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        border: '2px solid black',
        borderRadius: '8px',
        background: 'transparent',
        position: 'relative',
        cursor: 'move', 
        userSelect: 'none' 
      }}
    >
      <Handle type="target" position="left" style={{ background: '#555' }} />
      <Handle type="source" position="right" style={{ background: '#555' }} />
      <div
        className="resize-handle right"
        style={{
          position: 'absolute',
          right: '-2px',
          top: '0',
          width: '4px',
          height: '100%',
          cursor: 'ew-resize',
          touchAction: 'none',
          zIndex: 1,
          opacity: 0
        }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleResize(e, ['right']);
        }}
      />
      <div
        className="resize-handle bottom"
        style={{
          position: 'absolute',
          bottom: '-2px',
          left: '0',
          width: '100%',
          height: '4px',
          cursor: 'ns-resize',
          touchAction: 'none',
          zIndex: 1,
          opacity: 0
        }}
        onPointerDown={(e) => handleResize(e, ['bottom'])}
      />
      <div
        className="resize-handle corner"
        style={{
          position: 'absolute',
          bottom: '-3px',
          right: '-3px',
          width: '6px',
          height: '6px',
          cursor: 'nwse-resize',
          touchAction: 'none',
          zIndex: 2,
          opacity: 0,
          borderRadius: '50%'
        }}
        onPointerDown={(e) => handleResize(e, ['right', 'bottom'])}
      />
    </div>
  );
};

function Sidebar({ onAddBox }) {
  return (
    <aside>
      <div className="description">Use the buttons below to add elements:</div>
      <div className="sidebar-buttons">
        <div className="dndnode box-node" onClick={onAddBox}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Box
        </div>
      </div>
    </aside>
  );
}

function App() {
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstance = useRef(null);
  const [nodeTitle, setNodeTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [edgeContextMenu, setEdgeContextMenu] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [connectSource, setConnectSource] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('token') || '');
  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('token') ? 'app' : 'home';
  });
  const [toasts, setToasts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const customNodeTypes = {
    box: (props) => (
      <Box 
        {...props} 
        setNodes={setNodes} 
        nodes={nodes} 
      />
    ),
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    if (currentView === 'app') {
      fetchTree();
    }
  }, [currentView]);

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setSelectedNode(null);
      setEdgeContextMenu(null);
      setSelectedEdge(null);
      setConnectSource(null); 
    };

    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, []);

  useEffect(() => {
    if (currentView !== 'app') return;

    const handleHandleClick = async (event) => {
      event.stopPropagation(); 

      const handleElement = event.target.closest('.react-flow__handle');
      if (!handleElement) return;

      const nodeElement = handleElement.closest('.react-flow__node');
      if (!nodeElement) return;

      const nodeId = nodeElement.getAttribute('data-id');
      const handleType = handleElement.classList.contains('react-flow__handle-source')
        ? 'source'
        : 'target';

      if (!connectSource) {
        setConnectSource({ nodeId, handleType });
      } else if (connectSource.nodeId !== nodeId) {
        const newEdge = {
          id: `${connectSource.nodeId}-${nodeId}-${Date.now()}`,
          source: connectSource.handleType === 'source' ? connectSource.nodeId : nodeId,
          target: connectSource.handleType === 'source' ? nodeId : connectSource.nodeId,
          animated: true,
          reverseAnimated: false,
          style: { animationDirection: 'normal' },
        };

        setEdges((eds) => addEdge(newEdge, eds));

        try {
          await axios
            .put(`/api/thinking-trees/${newEdge.target}/parent`, {
              parentId: newEdge.source,
            }, {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            })
            .then(() => {
              console.log(`Updated parent of node ${newEdge.target} to ${newEdge.source}`);
            })
            .catch((error) => {
              console.error('Error updating parent node:', error);
              alert('Failed to update parent node.');
            });
        } catch (error) {
          console.error('Error updating parent node:', error);
          alert('Failed to update parent node.');
        }

        setConnectSource(null); 
      } else {
        setConnectSource(null);
      }
    };

    window.addEventListener('click', handleHandleClick);
    return () => {
      window.removeEventListener('click', handleHandleClick);
    };
  }, [connectSource, currentView, authToken]);

  const fetchTree = async () => {
    try {
      const response = await axios.get('/api/thinking-trees/full-tree', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      // Process response as before
      const { tree, edges: fetchedEdges } = response.data;
      const flowNodes = [];
      const flowEdges = [];

      const processNode = (node) => {
        flowNodes.push({
          id: node._id,
          data: { label: node.title },
          position: node.position || { x: Math.random() * 250, y: Math.random() * 250 },
          type: node.type || 'default',
        });
      };

      const traverseTree = (nodes) => {
        nodes.forEach((node) => {
          processNode(node);
          traverseTree(node.children);
        });
      };

      traverseTree(tree);
      fetchedEdges.forEach((edge) => {
        flowEdges.push({
          id: edge._id, 
          source: edge.source,
          target: edge.target,
          animated: edge.animated,
          reverseAnimated: edge.reverseAnimated,
          style: { animationDirection: edge.reverseAnimated ? 'reverse' : 'normal' },
        });
      });

      if (flowNodes.length === 0) {
        addCentralNode(flowNodes, flowEdges);
      } else {
        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    } catch (error) {
      console.error('Error fetching tree:', error);
      if (error.response && error.response.status === 401) {
        setAuthToken('');
        localStorage.removeItem('token');
        setCurrentView('home');
      }
    }
  };

  const addCentralNode = async (flowNodes, flowEdges) => {
    try {
      const response = await axios.post('/api/thinking-trees', {
        title: 'Central Node',
        content: '',
        parentIds: [],
        position: { x: 250, y: 250 },
        type: 'central',
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
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

  const onConnectHandler = useCallback(
    async (params) => {
      const newEdge = {
        id: `${params.source}-${params.target}-${Date.now()}`,
        source: params.source,
        target: params.target,
        animated: true,
        reverseAnimated: false,
        style: { animationDirection: 'normal' },
      };
      setEdges((eds) => addEdge(newEdge, eds));

      try {
        await axios.put(`/api/thinking-trees/${newEdge.target}/parent`, {
          parentId: newEdge.source,
        }, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        console.log(`Updated parent of node ${newEdge.target} to ${newEdge.source}`);
      } catch (error) {
        console.error('Error updating parent node:', error);
        alert('Failed to update parent node.');
      }
    },
    [authToken]
  );

  const onElementsRemoveHandler = (elementsToRemove) => {
    const nodesToRemove = elementsToRemove.filter((el) => !el.source);
    const edgesToRemove = elementsToRemove.filter((el) => el.source);

    setNodes((nds) => nds.filter((node) => !nodesToRemove.some((nor) => nor.id === node.id)));
    setEdges((eds) => eds.filter((edge) => !edgesToRemove.some((eor) => eor.id === edge.id)));

    nodesToRemove.forEach(async (node) => {
      try {
        await axios.delete(`/thinking-trees/${node.id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
      } catch (error) {
        console.error('Error deleting node:', error);
      }
    });
  };

  const onLoadHandler = useCallback((instance) => {
    reactFlowInstance.current = instance;
    console.log('React Flow instance loaded:', instance);
  }, []);

  const saveTree = useCallback(async () => {
    setIsSaving(true);
    
    try {
      const nodesData = nodes.map((node) => ({
        _id: node.id,
        title: node.data.label,
        content: '',
        parents: edges.filter((edge) => edge.target === node.id).map((edge) => edge.source),
        position: node.position,
        type: node.type || 'default',
      }));
      const edgesData = edges.map((edge) => ({
        _id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: edge.animated,
        reverseAnimated: edge.reverseAnimated,
      }));

      await axios.put('/api/thinking-trees/bulk-update', {
        nodes: nodesData,
        edges: edgesData, 
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      console.log('Tree saved successfully!');
    } catch (error) {
      console.error('Error saving tree:', error);
      alert('Failed to save tree.');
    }
    
    setIsSaving(false);
  }, [nodes, edges, authToken]);

  const debouncedSaveTree = useCallback(
    debounce(async () => {
      await saveTree();
    }, 1000),
    [saveTree]
  );

  useEffect(() => {
    if (currentView === 'app') {
      debouncedSaveTree();
    }

    return debouncedSaveTree.cancel;
  }, [nodes, edges, debouncedSaveTree, currentView]);

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
      setNodes((nds) => nds.map(node => node.id === newNode.id ? {
        ...node,
        id: createdNode._id,
      } : node));
      setNodeTitle('');
      setIsAdding(false);
      addToast('Node added successfully!', 'success'); 
    } catch (error) {
      console.error('Error adding node:', error);
      alert('Failed to add node.');
      addToast('Failed to add node.', 'error'); 
    }
  };

  const handleAddBox = () => {
    const newBox = {
      id: `temp-box-${Date.now()}`,
      type: 'box',
      data: { 
        label: 'New Box',
        description: 'Click to edit'
      },
      position: { x: Math.random() * 250, y: Math.random() * 250 },
    };

    setNodes((nds) => [...nds, newBox]);
  };

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedNode(node);
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
    setEdgeContextMenu(null);
  }, []);

  const handleDelete = async () => {
    if (selectedNode) {
      const updatedNodes = nodes.filter((node) => node.id !== selectedNode.id);
      setNodes(updatedNodes);
      const updatedEdges = edges.filter(
        (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
      );
      setEdges(updatedEdges);
      try {
        await axios.delete(`/api/thinking-trees/${selectedNode.id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        addToast('Node deleted successfully.', 'success');
      } catch (error) {
        console.error('Error deleting node:', error);
      }
      setContextMenu(null);
      setSelectedNode(null);
    }
  };

  const onNodeDragStopHandler = useCallback(
    async (event, node) => {
      const { id, position } = node;
      console.log(`Node ${id} moved to`, position);

      try {
        await axios.put(`/api/thinking-trees/${id}/position`, {
          x: position.x,
          y: position.y,
        }, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        console.log(`Position of node ${id} updated successfully.`);
      } catch (error) {
        console.error(`Error updating position of node ${id}:`, error);
        alert('Failed to update node position.');
      }
    },
    [authToken]
  );

  const handleEdit = () => {
    if (selectedNode) {
      setEditedTitle(selectedNode.data.label);
      setIsEditing(true);
      setContextMenu(null);
    }
  };

  const saveEditedTitle = async () => {
    if (!editedTitle.trim()) {
      alert('Node title cannot be empty.');
      return;
    }

    try {
      const response = await api.put(`/thinking-trees/${selectedNode.id}/title`, {
        title: editedTitle,
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const updatedNode = response.data;

      setNodes((nds) =>
        nds.map((node) =>
          node.id === updatedNode._id
            ? { ...node, data: { ...node.data, label: updatedNode.title } }
            : node
        )
      );

      setIsEditing(false);
      setSelectedNode(null);
      alert('Node name updated successfully!');
      addToast('Node name updated successfully!', 'success'); 
    } catch (error) {
      console.error('Error updating node title:', error);
      alert('Failed to update node name.');
      addToast('Failed to update node name.', 'error'); 
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedTitle('');
  };

  const onEdgeClickHandler = useCallback((event, edge) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedEdge(edge);
    setEdgeContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
    setContextMenu(null);
  }, []);

  const handleEdgeDelete = async () => {
    if (selectedEdge) {
      try {
        await axios.put(`/api/thinking-trees/edges/${selectedEdge.id}/remove-parent`, {
          parentId: selectedEdge.source,
        }, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
      } catch (error) {
        console.error('Error deleting edge:', error);
        alert('Failed to delete edge.');
      }
      setEdgeContextMenu(null);
      setSelectedEdge(null);
    }
  };

  const handleEdgeReverse = async () => {
    if (selectedEdge) {
      try {
        const updatedReverseAnimated = !selectedEdge.reverseAnimated;
        const response = await axios.put(`/api/thinking-trees/edges/${selectedEdge.id}/reverse-animation`, {
          reverseAnimated: updatedReverseAnimated,
        }, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const updatedEdge = response.data;

        setEdges((eds) =>
          eds.map((e) =>
            e.id === updatedEdge.id
              ? {
                  ...e,
                  reverseAnimated: updatedEdge.reverseAnimated,
                  style: {
                    ...e.style,
                    animationDirection: updatedEdge.reverseAnimated ? 'reverse' : 'normal',
                  },
                }
              : e
          )
        );
      } catch (error) {
        console.error('Error reversing edge animation:', error);
        alert('Failed to reverse edge animation.');
      }
      setEdgeContextMenu(null);
      setSelectedEdge(null);
    }
  };

  const handleMakeBidirectional = () => {
    if (selectedEdge) {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === selectedEdge.id
            ? {
                ...edge,
                animated: true,
                style: {
                  ...edge.style,
                  animation: 'flowBidirectional 4s linear infinite',
                },
                data: {
                  ...edge.data,
                  isBidirectional: true,
                },
              }
            : edge
        )
      );
      setEdgeContextMenu(null);
      setSelectedEdge(null);
    }
  };
  const handleNormalFlow = () => {
    if (selectedEdge) {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === selectedEdge.id
            ? {
                ...edge,
                animated: true,
                style: {
                  ...edge.style,
                  animation: null,
                },
                data: {
                  ...edge.data,
                  isBidirectional: false,
                },
              }
            : edge
        )
      );
      setEdgeContextMenu(null);
      setSelectedEdge(null);
    }
  };

  const handleSignup = async () => {
  };

  const handleLogin = (token) => {
    setAuthToken(token);
    localStorage.setItem('token', token);
    navigate('/members'); 
  };

  const handleLogout = () => {
    setAuthToken('');
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleAddLabel = (nodeId) => {
    const updatedNodes = nodes.map((node) =>
      node.id === nodeId
        ? {
            ...node,
            className: 'node-with-label',
            style: {
              ...node.style,
              background: '#10B981', 
              color: 'white',
            },
            hasLabel: true,
          }
        : node
    );
    
    setNodes(updatedNodes);
    
    setContextMenu(null);
  };

  return (
    <ReactFlowProvider>
      <AnimatePresence mode="wait">
        <Routes>
          <Route 
            path="/" 
            element={
              (authToken) ? (
                <Navigate to="/members" replace />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6 }}
                >
                  <Home onLogin={handleLogin} />
                </motion.div>
              )
            } 
          />
          <Route 
            path="/members" 
            element={
              authToken ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6 }}
                >
                  <Members addToast={addToast} />
                </motion.div>
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route path="/signup" element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <Signup onLogin={handleLogin} />
            </motion.div>
          } />
          <Route path="/login" element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <Login onLogin={handleLogin} />
            </motion.div>
          } /> 
          <Route
            path="/app"
            element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
              >
                <div className="wrapper">
                  <Sidebar onAddBox={handleAddBox} />
                  <div className="main">
                    <header className="App-header">
                      <Link to="/" className="page-title"><h1>Think Tree</h1></Link>
                      <div className="button-container">
                        <button className="btn" onClick={() => setIsAdding(true)}>
                          Add Node
                        </button>
                        <button className="btn" onClick={saveTree}>
                          Save Tree
                        </button>
                        <button className="btn cancel" onClick={handleLogout}>
                          Logout
                        </button>
                      </div>
                    </header>
                    {isAdding && (
                      <div className="modal">
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                    {isEditing && (
                      <div className="modal">
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                          <h2>Edit Node</h2>
                          <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            placeholder="Enter new node title"
                          />
                          <div className="color-picker">
                            <h3>Label Color</h3>
                            <div className="color-options">
                              {COLOR_PRESETS.map((color) => (
                                <div
                                  key={color.name}
                                  className={`color-option ${
                                    selectedNode?.style?.background === color.value ? 'selected' : ''
                                  }`}
                                  style={{ backgroundColor: color.value }}
                                  onClick={() => {
                                    const updatedNodes = nodes.map((node) =>
                                      node.id === selectedNode.id
                                        ? {
                                            ...node,
                                            className: 'node-with-label',
                                            style: {
                                              ...node.style,
                                              background: color.value,
                                              color: 'white',
                                            },
                                            hasLabel: true,
                                          }
                                        : node
                                    );
                                    setNodes(updatedNodes);
                                    setSelectedNode({
                                      ...selectedNode,
                                      style: {
                                        ...selectedNode.style,
                                        background: color.value,
                                      },
                                    });
                                  }}
                                >
                                  <span className="color-name">{color.name}</span>
                                  {selectedNode?.style?.background === color.value && (
                                    <span className="selected-indicator">✓</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="modal-actions">
                            <button className="btn" onClick={saveEditedTitle}>
                              Save
                            </button>
                            <button className="btn cancel" onClick={cancelEditing}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="react-flow-wrapper">
                      <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={customNodeTypes}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnectHandler}
                        onElementsRemove={onElementsRemoveHandler}
                        onNodeContextMenu={(event, node) => {
                          onNodeContextMenu(event, node);
                        }}
                        onEdgeClick={onEdgeClickHandler}
                        onNodeDragStop={onNodeDragStopHandler}
                        onLoad={onLoadHandler}
                        deleteKeyCode={46}
                        snapToGrid={true}
                        snapGrid={[15, 15]}
                        fitView
                      >
                        <MiniMap />
                        <Controls />
                        <Background />
                      </ReactFlow>
                    </div>
                    {contextMenu && (
                      <div
                        className="context-menu"
                        style={{
                          top: contextMenu.mouseY,
                          left: contextMenu.mouseX,
                          position: 'absolute',
                          backgroundColor: '#fff',
                          boxShadow: '0px 0px 5px rgba(0,0,0,0.2)',
                          borderRadius: '5px',
                          zIndex: 1000,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className="context-menu-item"
                          onClick={handleEdit}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                          }}
                        >
                          Edit
                        </div>
                        <div
                          className="context-menu-item"
                          onClick={handleDelete}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </div>
                        {!selectedNode.hasLabel && (
                          <div className="context-menu-item add-submenu">
                            Add     &#9654;
                            <div className="submenu">
                              <div
                                className="context-menu-item"
                                onClick={() => handleAddLabel(selectedNode.id)}
                                style={{
                                  padding: '8px 12px',
                                  cursor: 'pointer',
                                }}
                              >
                                Label
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {edgeContextMenu ? (
                      <div
                        className="context-menu"
                        style={{
                          top: edgeContextMenu.mouseY,
                          left: edgeContextMenu.mouseX,
                          position: 'absolute',
                          backgroundColor: '#fff',
                          boxShadow: '0px 0px 5px rgba(0,0,0,0.2)',
                          borderRadius: '5px',
                          zIndex: 1000,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className="context-menu-item"
                          onClick={handleEdgeDelete}
                          style={{
                            padding: '8px 12px',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </div>
                        {!selectedEdge?.data?.isBidirectional && (
                          <>
                            <div
                              className="context-menu-item"
                              onClick={handleEdgeReverse}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                              }}
                            >
                              Reverse
                            </div>
                            <div
                              className="context-menu-item"
                              onClick={handleMakeBidirectional}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                              }}
                            >
                              Both Ways
                            </div>
                          </>
                        )}
                        {selectedEdge?.data?.isBidirectional && (
                          <div
                            className="context-menu-item"
                            onClick={handleNormalFlow}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                            }}
                          >
                            Normal Flow
                          </div>
                        )}
                      </div>
                    ) : null}
                    {isSaving && (
                      <div className="saving-indicator">
                        <div className="saving-dot"></div>
                        Saving...
                      </div>
                    )}
                  </div>
                  <Toast toasts={toasts} removeToast={removeToast} />
                  {isLoading && (
                    <div className="loading-screen">
                      <div className="loading-spinner"></div>
                      <div className="loading-text">Loading Demo Mode...</div>
                    </div>
                  )}
                </div>
              </motion.div>
            }
          />
          <Route 
            path="/app/:canvasId" 
            element={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6 }}
              >
                <Canvas />
              </motion.div>
            }
          />
          <Route path="/features" element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <Features />
            </motion.div>
          } />
          <Route path="/about" element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6 }}
            >
              <About />
            </motion.div>
          } />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </AnimatePresence>
    </ReactFlowProvider>
  );
}

export default App;