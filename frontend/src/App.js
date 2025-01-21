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

  useEffect(() => {
    fetchTree();
  }, []);

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setSelectedNode(null);
      setEdgeContextMenu(null);
      setSelectedEdge(null);
    };

    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, []);

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

  const onConnectHandler = useCallback(
    async (params) => {
      setEdges((eds) => addEdge(params, eds));
      try {
        await axios.put(`/api/thinking-trees/${params.target}/parent`, {
          parentId: params.source,
        });
        console.log(`Updated parent of node ${params.target} to ${params.source}`);
      } catch (error) {
        console.error('Error updating parent node:', error);
        alert('Failed to update parent node.');
      }
    },
    []
  );

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
        parent: edges.find((edge) => edge.target === node.id)?.source || null,
        position: node.position,
        type: node.type || 'default',
      }));

      await axios.put('/api/thinking-trees/bulk-update', {
        nodes: nodesData,
      });
      console.log('Tree saved successfully!');
    } catch (error) {
      console.error('Error saving tree:', error);
      alert('Failed to save tree.');
    }
  }, [nodes, edges]);

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

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    event.stopPropagation(); 
    setSelectedNode(node);
    setContextMenu({
      mouseX: event.clientX - 2,
      mouseY: event.clientY - 4,
    });
  }, []);

  const handleDelete = async () => {
    if (selectedNode) {
      try {
        setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
        setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));

        await axios.delete(`/api/thinking-trees/${selectedNode.id}`);
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
        });
        console.log(`Position of node ${id} updated successfully.`);
      } catch (error) {
        console.error(`Error updating position of node ${id}:`, error);
        alert('Failed to update node position.');
      }
    },
    []
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
  }, []);

  const handleEdgeDelete = async () => {
    if (selectedEdge) {
      try {
        setEdges((eds) => eds.filter((e) => e.id !== selectedEdge.id));
        await axios.put(`/api/thinking-trees/${selectedEdge.target}/parent`, {
          parentId: null,
        });

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
        const { source, target } = selectedEdge;
        await axios.put(`/api/thinking-trees/${source}/parent`, {
          parentId: target,
        });
        setEdges((eds) =>
          eds.map((e) =>
            e.id === selectedEdge.id
              ? { ...e, source: target, target: source }
              : e
          )
        );

        console.log(`Edge ${selectedEdge.id} reversed successfully.`);
      } catch (error) {
        console.error('Error reversing edge:', error);
        alert('Failed to reverse edge.');
      } finally {
        setEdgeContextMenu(null);
        setSelectedEdge(null);
      }
    }
  };

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
    </ReactFlowProvider>
  );
}

export default App;