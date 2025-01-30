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
} from 'reactflow';
import axios from './api/axios';
import './App.css';
import debounce from 'lodash.debounce';
import Home from './Home';
import Signup from './Signup'; 
import Login from './Login'; 
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import api from './api/apiWrapper'; 
import { motion } from 'framer-motion';
import Toast from './components/Toast';
const COLOR_PRESETS = [
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Gray', value: '#9CA3AF' }, 
];

function Sidebar() {
  return (
    <aside>
      <div className="description">Use the "Add Node" button to create nodes.</div>
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
  const [isDemo, setIsDemo] = useState(localStorage.getItem('isDemo') === 'true'); 
  const [currentView, setCurrentView] = useState(() => {
    if (localStorage.getItem('isDemo') === 'true') return 'app';
    if (localStorage.getItem('token')) return 'app';
    return 'home';
  });
  const [toasts, setToasts] = useState([]);

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
  }, [currentView, isDemo]);

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

    const handleHandleClick = (event) => {
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

        if (!isDemo) {
          axios
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
  }, [connectSource, currentView, authToken, isDemo]);

  const fetchTree = async () => {
    if (isDemo) {
      const storedNodes = JSON.parse(localStorage.getItem('demo_nodes')) || [];
      const storedEdges = JSON.parse(localStorage.getItem('demo_edges')) || [];
      
      console.log('Loading demo data:', { storedNodes, storedEdges });
      
      setNodes(storedNodes.map(node => ({
        ...node,
        className: node.hasLabel ? 'node-with-label' : '',
        style: node.style || {},
        data: {
          ...node.data,
          labelText: node.data.labelText || ''
        }
      })));
      
      setEdges(storedEdges.map((edge) => ({
        ...edge,
        style: {
          ...edge.style,
          animationDirection: edge.reverseAnimated ? 'reverse' : 'normal',
        },
      })));
    } else {
      try {
        const response = await axios.get('/api/thinking-trees/full-tree', {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
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
      if (isDemo) {
        const newEdge = {
          id: `demo-edge-${Date.now()}`,
          source: params.source,
          target: params.target,
          animated: true,
          reverseAnimated: false,
          style: { animationDirection: 'normal' },
        };
        setEdges((eds) => {
          const updatedEdges = addEdge(newEdge, eds);
          localStorage.setItem('demo_edges', JSON.stringify(updatedEdges));
          return updatedEdges;
        });
        localStorage.setItem('demo_nodes', JSON.stringify(nodes));
      } else {
      }
    },
    [authToken, isDemo, nodes]
  );

  const onElementsRemoveHandler = (elementsToRemove) => {
    const nodesToRemove = elementsToRemove.filter((el) => !el.source);
    const edgesToRemove = elementsToRemove.filter((el) => el.source);

    setNodes((nds) => nds.filter((node) => !nodesToRemove.some((nor) => nor.id === node.id)));
    setEdges((eds) => eds.filter((edge) => !edgesToRemove.some((eor) => eor.id === edge.id)));

    nodesToRemove.forEach(async (node) => {
      try {
        await axios.delete(`/api/thinking-trees/${node.id}`, {
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
    if (isDemo) {
      console.log('Saving tree in demo mode');
      console.log('Nodes:', nodes);
      console.log('Edges:', edges);
      
      const nodesToSave = nodes.map(node => ({
        ...node,
        hasLabel: node.hasLabel,
        className: node.className,
        style: node.style,
        data: {
          ...node.data,
          labelText: node.data.labelText || ''
        }
      }));
      
      localStorage.setItem('demo_nodes', JSON.stringify(nodesToSave));
      localStorage.setItem('demo_edges', JSON.stringify(edges));
      
      console.log('Tree saved locally!');
    } else {
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
    }
  }, [nodes, edges, authToken, isDemo]);

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

    const newNodeId = isDemo ? `demo-node-${Date.now()}` : `temp-id-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      data: { label: nodeTitle },
      position: { x: Math.random() * 250, y: Math.random() * 250 },
      type: 'default',
    };

    setNodes((nds) => [...nds, newNode]);

    if (!isDemo) {
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
    }

    setNodeTitle('');
    setIsAdding(false);
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
      if (isDemo) {
        console.log(`Demo mode: Deleting node ${selectedNode.id} locally.`);
        setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
        setEdges((eds) =>
          eds.filter(
            (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
          )
        );
        saveTree();
        setContextMenu(null);
        setSelectedNode(null);
        addToast('Node deleted successfully.', 'success');
      } else {
        try {
          await axios.delete(`/api/thinking-trees/${selectedNode.id}`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
          setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
          setEdges((eds) =>
            eds.filter(
              (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
            )
          );
          alert('Node deleted successfully!');
          addToast('Node deleted successfully!', 'success');
        } catch (error) {
          console.error('Error deleting node:', error);
          addToast('Failed to delete node.', 'error');
        }
      }
    }
  };

  const onNodeDragStopHandler = useCallback(
    async (event, node) => {
      const { id, position } = node;
      console.log(`Node ${id} moved to`, position);

      if (isDemo) {
        const updatedNodes = nodes.map((n) =>
          n.id === id ? { ...n, position } : n
        );
        setNodes(updatedNodes);
        saveTree(); 
        return;
      }

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
    [authToken, isDemo, nodes, saveTree]
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

    if (isDemo) {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === selectedNode.id
            ? { ...node, data: { ...node.data, label: editedTitle } }
            : node
        )
      );
      setIsEditing(false);
      setSelectedNode(null);
      saveTree();
      addToast('Node name updated successfully!', 'success'); 
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
      if (isDemo) {
        setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
        localStorage.setItem('demo_edges', JSON.stringify(edges.filter((e) => e.id !== selectedEdge.id)));
      } else {
        try {
          await axios.put(`/api/thinking-trees/edges/${selectedEdge.id}/remove-parent`, {
            parentId: selectedEdge.source,
          }, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
          setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
          console.log(`Edge ${selectedEdge.id} deleted successfully.`);
        } catch (error) {
          console.error('Error deleting edge:', error);
          alert('Failed to delete edge.');
        } finally {
          setEdgeContextMenu(null);
          setSelectedEdge(null);
        }
      }
    }
  };

  const handleEdgeReverse = async () => {
    if (selectedEdge) {
      if (isDemo) {
        console.log('Reversing edge in demo mode:', selectedEdge.id);
        const updatedEdges = edges.map((e) =>
          e.id === selectedEdge.id
            ? {
                ...e,
                reverseAnimated: !e.reverseAnimated,
                style: {
                  ...e.style,
                  animationDirection: !e.reverseAnimated ? 'reverse' : 'normal',
                },
              }
            : e
        );
        setEdges(updatedEdges);
        localStorage.setItem('demo_edges', JSON.stringify(updatedEdges));
        console.log('Edge reversed and saved locally');
      } else {
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

          console.log(`Edge ${updatedEdge.id} animation direction reversed.`);
        } catch (error) {
          console.error('Error reversing edge animation:', error);
          alert('Failed to reverse edge animation.');
        } finally {
          setEdgeContextMenu(null);
          setSelectedEdge(null);
        }
      }
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
      
      if (isDemo) {
        localStorage.setItem('demo_edges', JSON.stringify(edges));
      }
    }
  };

  const handleSignup = async () => {
  };

  const handleLogin = (token, demo = false) => {
    setAuthToken(token);
    if (demo) {
      setIsDemo(true);
      localStorage.setItem('isDemo', 'true'); 
      console.log('Demo mode enabled');
      let storedNodes = JSON.parse(localStorage.getItem('demo_nodes'));
      let storedEdges = JSON.parse(localStorage.getItem('demo_edges'));

      if (!storedNodes || storedNodes.length === 0) {
        const centralNode = {
          id: `demo-node-1`,
          data: { label: 'Central Node' },
          position: { x: 250, y: 250 },
          type: 'default',
        };
        storedNodes = [centralNode];
        localStorage.setItem('demo_nodes', JSON.stringify(storedNodes));
      }

      if (!storedEdges) {
        storedEdges = [];
        localStorage.setItem('demo_edges', JSON.stringify(storedEdges));
      }

      setNodes(storedNodes);
      setEdges(
        storedEdges.map((edge) => ({
          ...edge,
          style: {
            ...edge.style,
            animationDirection: edge.reverseAnimated ? 'reverse' : 'normal',
          },
        }))
      );
    } else {
      localStorage.setItem('token', token);
      localStorage.removeItem('isDemo');
      setIsDemo(false);
    }
    setCurrentView('app');
  };

  const handleLogout = () => {
    setAuthToken('');
    setIsDemo(false);
    localStorage.removeItem('token');
    localStorage.removeItem('isDemo'); 
    setCurrentView('home');
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
    
    if (isDemo) {
      const nodesToSave = updatedNodes.map(node => ({
        ...node,
        hasLabel: node.hasLabel,
        className: node.className,
        style: node.style, 
      }));
      localStorage.setItem('demo_nodes', JSON.stringify(nodesToSave));
    }
    
    setContextMenu(null);
  };

  const handleDemoSignup = () => {
    setIsDemo(false);
    localStorage.removeItem('isDemo');
    navigate('/signup'); 
  };

  return (
    <ReactFlowProvider>
      <Routes>
        <Route path="/" element={<Home onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup onLogin={handleLogin} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} /> 
        <Route
          path="/app"
          element={
            <div className="wrapper">
              <Sidebar />
              <div className="main">
                <header className="App-header">
                  <Link to="/" className="page-title"><h1>Think Tree</h1></Link>
                  <div className="button-container">
                    <button className="btn" onClick={() => setIsAdding(true)}>
                      Add Node
                    </button>
                    {!isDemo && (
                      <button className="btn" onClick={saveTree}>
                        Save Tree
                      </button>
                    )}
                    {!isDemo ? (
                      <button className="btn cancel" onClick={handleLogout}>
                        Logout
                      </button>
                    ) : (
                      <button className="btn signup" onClick={handleDemoSignup}>
                        Signup
                      </button>
                    )}
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
                                if (isDemo) {
                                  localStorage.setItem('demo_nodes', JSON.stringify(updatedNodes));
                                }
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
                {contextMenu ? (
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
                  </div>
                ) : null}
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
                      Make Bidirectional
                    </div>
                  </div>
                ) : null}
              </div>
              <Toast toasts={toasts} removeToast={removeToast} />
            </div>
          }
        />
      </Routes>
    </ReactFlowProvider>
  );
}

export default App;