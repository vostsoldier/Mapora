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
import axios from 'axios';
import './App.css';
import debounce from 'lodash.debounce';
import Home from './Home';

function Sidebar() {
  return (
    <aside>
      <div className="description">Use the "Add Node" button to create nodes.</div>
    </aside>
  );
}

function App() {
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
  const [isDemo, setIsDemo] = useState(false); // Added state for demo mode
  const [currentView, setCurrentView] = useState(authToken || isDemo ? 'app' : 'home');

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
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            reverseAnimated: false,
            style: { animationDirection: 'normal' },
          },
          eds
        )
      );
      try {
        await axios.put(`/api/thinking-trees/${params.target}/parent`, {
          parentId: params.source,
        }, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        console.log(`Updated parent of node ${params.target} to ${params.source}`);
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
    try {
      const nodesData = nodes.map((node) => ({
        _id: node.id,
        title: node.data.label,
        content: '',
        parents: edges.filter((edge) => edge.target === node.id).map((edge) => edge.source),
        position: node.position,
        type: node.type || 'default',
      }));

      await axios.put('/api/thinking-trees/bulk-update', {
        nodes: nodesData,
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

    try {
      const response = await axios.post('/api/thinking-trees', {
        title: nodeTitle,
        content: '',
        parentIds: [],
        position: { x: Math.random() * 250, y: Math.random() * 250 },
        type: 'default',
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
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
      try {
        setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
        setEdges((eds) =>
          eds.filter(
            (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id
          )
        );

        await axios.delete(`/api/thinking-trees/${selectedNode.id}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        console.log(`Node ${selectedNode.id} deleted successfully.`);
      } catch (error) {
        console.error('Error deleting node:', error);
        alert('Failed to delete node.');
      } finally {
        setContextMenu(null);
        setSelectedNode(null);
      }
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
      const response = await axios.put(`/api/thinking-trees/${selectedNode.id}/title`, {
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
      alert('Node title updated successfully!');
    } catch (error) {
      console.error('Error updating node title:', error);
      alert('Failed to update node title.');
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

        console.log(`Edge ${selectedEdge.id} deleted successfully.`);
      } catch (error) {
        console.error('Error deleting edge:', error);
        alert('Failed to delete edge.');
      } finally {
        setEdgeContextMenu(null);
        setSelectedEdge(null);
      }
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

        console.log(`Edge ${updatedEdge.id} animation direction reversed.`);
      } catch (error) {
        console.error('Error reversing edge animation:', error);
        alert('Failed to reverse edge animation.');
      } finally {
        setEdgeContextMenu(null);
        setSelectedEdge(null);
      }
    }
  };

  const handleSignup = async () => {
  };

  const handleLogin = (token, demo = false) => {
    setAuthToken(token);
    if (demo) {
      setIsDemo(true);
    } else {
      localStorage.setItem('token', token);
    }
    setCurrentView('app');
  };

  const handleLogout = () => {
    setAuthToken('');
    setIsDemo(false);
    localStorage.removeItem('token');
    setCurrentView('home');
  };

  return (
    <ReactFlowProvider>
      {currentView === 'home' ? (
        <Home onLogin={handleLogin} />
      ) : (
        <div className="wrapper">
          <Sidebar />
          <div className="main">
            <header className="App-header">
              <h1>Think Tree</h1>
              <div className="button-container">
                <button className="btn" onClick={() => setIsAdding(true)}>
                  Add Node
                </button>
                {!isDemo && (
                  <button className="btn" onClick={saveTree}>
                    Save Tree
                  </button>
                )}
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
                  <h2>Edit Node Title</h2>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    placeholder="Enter new node title"
                  />
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
                onNodeContextMenu={onNodeContextMenu}
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
              </div>
            ) : null}
          </div>
        </div>
      )}
    </ReactFlowProvider>
  );
}

export default App;