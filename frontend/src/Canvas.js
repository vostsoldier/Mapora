import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Handle,
} from 'reactflow';
import axios from './api/axios';
import api from './api/apiWrapper';
import 'reactflow/dist/style.css';
import './App.css';
import debounce from 'lodash.debounce';

const Box = ({ data, id, setNodes, nodes }) => {
  const [dimensions, setDimensions] = useState({
    width: data.width || 150,
    height: data.height || 100
  });

  const handleResize = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
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
      setNodes((nds) => nds.map((node) =>
        node.id === id ? {
          ...node,
          data: {
            ...node.data,
            width: newDimensions.width,
            height: newDimensions.height,
          },
        } : node
      ));
    };

    const handlePointerUp = (upEvent) => {
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
        userSelect: 'none',
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
          opacity: 0,
        }}
        onPointerDown={(e) => handleResize(e, ['right'])}
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
          opacity: 0,
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
          borderRadius: '50%',
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

const COLOR_PRESETS = [
  { name: 'Default', value: 'white' },
  { name: 'Green', value: '#10B981' },
  { name: 'Blue', value: '#2563EB' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Gray', value: '#9CA3AF' },
];

const Canvas = () => {
  const { canvasId } = useParams();
  const navigate = useNavigate();
  const reactFlowInstance = useRef(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeTitle, setNodeTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [connectSource, setConnectSource] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [edgeContextMenu, setEdgeContextMenu] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [selectedLabelColor, setSelectedLabelColor] = useState('#10B981'); 
  const [authToken, setAuthToken] = useState(localStorage.getItem('token') || '');

  const customNodeTypes = useMemo(() => ({
    box: Box,
  }), []);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };
  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };
  useEffect(() => {
    const fetchCanvas = async () => {
      try {
        if (!canvasId) return;
        const response = await api.get(`/canvas/${canvasId}`);
        setNodes(response.data.nodes);
        setEdges(response.data.edges);
      } catch (error) {
        console.error('Error fetching canvas:', error);
      }
    };
    fetchCanvas();
  }, [canvasId, setNodes, setEdges]);
  const onConnectHandler = useCallback(
    (params) => {
      setEdges((eds) => addEdge({ ...params, animated: true }, eds || []));
    },
    [setEdges]
  );
  const saveTree = useCallback(async () => {
    if (!canvasId) {
      console.warn('No canvasId available. Skipping update.');
      return;
    }
    
    const payload = {
      nodes: (nodes || []).map((node) => ({
        id: node.id,
        label: node.data.label,
        position: node.position,
        type: node.type,
      })),
      edges: (edges || []).map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: edge.animated,
      })),
    };
  
    console.log('Saving canvas with id:', canvasId);
  
    try {
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
    const newNodeId = `temp-box-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: 'default',
      data: { label: nodeTitle, description: 'Click to edit' },
      position: { x: Math.random() * 250, y: Math.random() * 250 },
    };

    setNodes((nds) => (Array.isArray(nds) ? [...nds, newNode] : [newNode]));

    try {
      await axios.post(
        '/api/thinking-trees',
        {
          title: nodeTitle,
          content: '',
          parentIds: [],
          position: newNode.position,
          type: 'default',
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
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
  const handleAddBox = () => {
    const newBox = {
      id: `temp-box-${Date.now()}`,
      type: 'box',
      data: {
        label: 'New Box',
        description: 'Click to edit',
      },
      position: { x: Math.random() * 250, y: Math.random() * 250 },
    };
    setNodes((nds) => [...nds, newBox]);
  };
  const handleLogout = () => {
    navigate('/');
  };

  const onLoadHandler = useCallback((instance) => {
    reactFlowInstance.current = instance;
    console.log('React Flow instance loaded:', instance);
  }, []);
  const debouncedSaveTree = useCallback(
    debounce(async () => {
      await saveTree();
    }, 1000),
    [saveTree]
  );
  useEffect(() => {
    debouncedSaveTree();
    return debouncedSaveTree.cancel;
  }, [nodes, edges, debouncedSaveTree]);

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
  const handleDelete = () => {
    if (selectedNode) {
      setNodes((currentNodes) =>
        Array.isArray(currentNodes)
          ? currentNodes.filter((n) => n.id !== selectedNode.id)
          : []
      );
      setEdges((currentEdges) =>
        Array.isArray(currentEdges)
          ? currentEdges.filter(
              (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
            )
          : []
      );
      addToast('Node deleted successfully.', 'success');
      setContextMenu(null);
      setSelectedNode(null);
    }
  };
  const handleAddLabel = (nodeId) => {
    const defaultLabelColor = '#10B981';
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: { ...node.data },
              style: {
                ...node.style,
                background: defaultLabelColor,
                color: 'white',
              },
              hasLabel: true,
            }
          : node
      )
    );
    addToast('Label added successfully!', 'success');
    setContextMenu(null);
    setSelectedNode(null);
  };
  const handleEdit = () => {
    if (selectedNode) {
      setEditedTitle(selectedNode?.data?.label || '');
      setIsEditing(true);
      setContextMenu(null);
    }
  };

  const saveEditedTitle = () => {
    if (!editedTitle.trim()) {
      addToast('Node title cannot be empty.', 'error');
      return;
    }
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: { ...node.data, label: editedTitle },
              style: {
                ...node.style,
                background: selectedLabelColor,
                color: 'white'
              },
              hasLabel: true,
            }
          : node
      )
    );
    addToast('Node updated successfully!', 'success');
    setIsEditing(false);
    setSelectedNode(null);
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

  const handleEdgeDelete = () => {
    if (selectedEdge) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
      addToast('Edge deleted successfully.', 'success');
      setEdgeContextMenu(null);
      setSelectedEdge(null);
    }
  };

  const handleEdgeReverse = () => {
    if (selectedEdge) {
      const updatedReverse = !selectedEdge.reverseAnimated;
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === selectedEdge.id
            ? {
                ...edge,
                reverseAnimated: updatedReverse,
                style: {
                  ...edge.style,
                  animationDirection: updatedReverse ? 'reverse' : 'normal',
                },
              }
            : edge
        )
      );
      addToast('Edge reversed.', 'success');
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
                data: { ...edge.data, isBidirectional: true },
              }
            : edge
        )
      );
      addToast('Edge set to both ways.', 'success');
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
                style: { ...edge.style, animation: null },
                data: { ...edge.data, isBidirectional: false },
              }
            : edge
        )
      );
      addToast('Edge set to normal flow.', 'success');
      setEdgeContextMenu(null);
      setSelectedEdge(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (contextMenu && !event.target.closest('.context-menu')) {
        setContextMenu(null);
      }
      if (edgeContextMenu && !event.target.closest('.context-menu')) {
        setEdgeContextMenu(null);
      }
    };

    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [contextMenu, edgeContextMenu]);

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
              <button className="btn" onClick={() => setIsAdding(true)}>
                Add Node
              </button>
              <button className="btn cancel" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </header>
          {isAdding && (
            <div className="modal" onClick={() => setIsAdding(false)}>
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
            <div className="modal" onClick={() => setIsEditing(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Edit Node</h2>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Enter new node title"
                />
                <h3>Label Color</h3>
                <div className="color-options">
                  {COLOR_PRESETS.map((color) => (
                    <div
                      key={color.name}
                      className={`color-option ${
                        selectedLabelColor === color.value ? 'selected' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setSelectedLabelColor(color.value)}
                    >
                      <span className="color-name">{color.name}</span>
                      {selectedLabelColor === color.value && (
                        <span className="selected-indicator">✓</span>
                      )}
                    </div>
                  ))}
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
              nodeTypes={customNodeTypes}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnectHandler}
              onNodeContextMenu={onNodeContextMenu}
              onEdgeClick={onEdgeClickHandler}
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
              {selectedNode && !selectedNode.hasLabel && (
                <div className="context-menu-item add-submenu">
                  Add &#9654;
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
          {edgeContextMenu && (
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
                style={{ padding: '8px 12px', cursor: 'pointer' }}
              >
                Delete
              </div>
              <div
                className="context-menu-item"
                onClick={handleEdgeReverse}
                style={{ padding: '8px 12px', cursor: 'pointer' }}
              >
                Reverse
              </div>
              {selectedEdge && selectedEdge.data?.isBidirectional ? (
                <div
                  className="context-menu-item"
                  onClick={handleNormalFlow}
                  style={{ padding: '8px 12px', cursor: 'pointer' }}
                >
                  Normal Flow
                </div>
              ) : (
                <div
                  className="context-menu-item"
                  onClick={handleMakeBidirectional}
                  style={{ padding: '8px 12px', cursor: 'pointer' }}
                >
                  Both Ways
                </div>
              )}
            </div>
          )}
          <div className="toast-container">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`toast ${toast.type}`}
                onClick={() => removeToast(toast.id)}
              >
                {toast.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
};

export default Canvas;
