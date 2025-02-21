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
import html2canvas from 'html2canvas';

const TextboxNode = ({ data, id, updateNode }) => {
  const { text } = data;
  const [isEditing, setIsEditing] = useState(false);
  const textRef = useRef(null);

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setTimeout(() => textRef.current && textRef.current.focus(), 0);
  };

  const handleBlur = (e) => {
    const newText = e.target.innerText;
    if (typeof updateNode === 'function') {
      updateNode(id, { data: { ...data, text: newText } });
    }
    setIsEditing(false);
  };

  return (
    <div onDoubleClick={handleDoubleClick}>
      {isEditing ? (
        <div
          ref={textRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={handleBlur}
          style={{
            padding: '4px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            outline: 'none',      
            transition: 'none',    
            animation: 'none'      
          }}
        >
          {text}
        </div>
      ) : (
        <div>{text || 'Double-click to edit'}</div>
      )}
    </div>
  );
};
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

function Sidebar({ onAddBox, onAddTextbox }) {
  return (
    <aside>
      <div className="description">Use the buttons below to add elements:</div>
      <div className="sidebar-buttons">
        <div className="dndnode box-node" onClick={onAddBox}>
          <span>Box</span>
        </div>
        <div className="dndnode textbox-node" onClick={onAddTextbox}>
          <span>Textbox</span>
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

function Canvas() {
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
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const canvasContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const nodeTypes = useMemo(() => ({
    textbox: TextboxNode,
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
      const startTime = Date.now();
      try {
        if (!canvasId) return;
        const response = await api.get(`/canvas/${canvasId}`);
        const canvasData = response.data;
        const fetchedNodes = canvasData.nodes.map((node) => ({
          id: node.id,
          data:
            node.type === 'textbox'
              ? { text: node.text || '' } 
              : { label: node.label || '' },
          position: node.position,
          type: node.type,
        }));
        setNodes(fetchedNodes);
        setEdges(canvasData.edges);
      } catch (error) {
        console.error('Error fetching canvas:', error);
      } finally {
        const elapsed = Date.now() - startTime;
        const remainingDelay = 3000; 
        console.log('Elapsed time:', elapsed, 'ms. Remaining delay:', remainingDelay, 'ms.');
        setTimeout(() => {
          setFadeOut(true);
          setTimeout(() => {
            setIsLoading(false);
            console.log('Loading complete, hiding loader.');
          }, 1000);
        }, remainingDelay);
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
        position: node.position,
        type: node.type,
        ...(node.type === 'textbox'
            ? { text: node.data?.text || '' }
            : { label: node.data?.label || '' }),
        style: node.style || {},
        data: node.data || {},
      })),
      edges: (edges || []).map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: edge.animated,
        reverseAnimated: edge.reverseAnimated || false,
        data: { ...(edge.data || {}), isBidirectional: edge.data?.isBidirectional || false },
        style: edge.style || {},
      })),
    };
  
    console.log('Saving canvas with id:', canvasId, payload);
  
    try {
      await api.put(`/canvas/${canvasId}`, payload);
      addToast('Canvas saved successfully.', 'success');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        if (error.response.data.message.includes('75 models')) {
          addToast('Model limit reached: Only 75 models allowed per canvas.', 'error');
        } else {
          addToast(error.response.data.message, 'error');
        }
      } else {
        addToast('Error saving canvas.', 'error');
      }
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
  const handleAddTextbox = () => {
    const newTextboxNode = {
      id: `temp-textbox-${Date.now()}`,
      type: 'textbox',
      data: { text: 'New Text' },
      position: { x: Math.random() * 250, y: Math.random() * 250 },
      style: {},
    };
    
    setNodes((nds) => [...nds, newTextboxNode]);
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

  useEffect(() => {
    const handleClick = (event) => {
      if (event.target.closest('.react-flow__edge-path')) {
        return;
      }
      setContextMenu(null);
      setEdgeContextMenu(null);
      setSelectedEdge(null);
      setSelectedNode(null);
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleShare = async () => {
    try {
      await api.post('/invitations', { canvasId, inviteeEmail: inviteEmail }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setShareMessage('Invitation sent.');
      setInviteEmail('');
      setShareModalOpen(false);
    } catch (error) {
      console.error('Error sending invitation:', error);
      setShareMessage('Error sending invitation.');
    }
  };

  const updateNode = useCallback((nodeId, updatedProperties) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, ...updatedProperties } : node
      )
    );
  }, [setNodes]);

  const customNodeTypes = useMemo(() => ({
    textbox: (props) => <TextboxNode {...props} updateNode={updateNode} />,
    box: (props) => <Box {...props} setNodes={setNodes} />, 
  }), [updateNode, setNodes]);

  const onNodeDragStopHandler = useCallback((event, node) => {
    console.log(`Node ${node.id} dragged to:`, node.position);
    updateNode(node.id, { position: { ...node.position } });
  }, [updateNode]);

  const exportAsPNG = useCallback(() => {
    if (canvasContainerRef.current) {
      html2canvas(canvasContainerRef.current).then((canvas) => {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `canvas_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  }, []);

  return (
    <ReactFlowProvider>
      <div className="wrapper">
        <Sidebar onAddBox={handleAddBox} onAddTextbox={handleAddTextbox} />
        <div className="main">
          <header className="App-header">
            <Link to="/" className="page-title">
              <h1>Mapora</h1>
            </Link>
            <div className="button-container">
              <button className="btn" onClick={() => setIsAdding(true)}>
                Add Node
              </button>
              <button className="btn share" onClick={() => setShareModalOpen(true)}>
                Share Canvas
              </button>
              <button className="btn" onClick={exportAsPNG}>
                Export PNG
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
          {shareModalOpen && (
            <div className="modal" onClick={() => setShareModalOpen(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Share Canvas</h2>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter invitee email"
                  required
                />
                <button className="btn" onClick={handleShare}>
                  Send Invitation
                </button>
                {shareMessage && <p>{shareMessage}</p>}
              </div>
            </div>
          )}
          {isLoading ? (
            <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
              <div className="loading-spinner"></div>
              <div className="loading-text">Loading Canvas...</div>
            </div>
          ) : (
            <div className="react-flow-wrapper" ref={canvasContainerRef}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={customNodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnectHandler}
                onNodeDragStop={onNodeDragStopHandler}  
                fitView
              >
                <MiniMap />
                <Controls />
                <Background />
              </ReactFlow>
            </div>
          )}
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
