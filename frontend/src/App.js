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
const nodeTypesList = [
  { type: 'TypeA', label: 'Type A' },
  { type: 'TypeB', label: 'Type B' },
  { type: 'TypeC', label: 'Type C' },
];
const initialNodes = [];
const initialEdges = [];
function Sidebar() {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
    console.log(`Drag started for node type: ${nodeType}`);
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
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowInstance = useRef(null);
  const [nodeTitle, setNodeTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  useEffect(() => {
    fetchTree();
  }, []);

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setSelectedNode(null);
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
  const onConnectHandler = (params) => setEdges((eds) => addEdge(params, eds));
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
  const saveTree = async () => {
    if (reactFlowInstance.current) {
      const flow = reactFlowInstance.current.toObject();
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
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      console.log('Drop event triggered');

      if (!reactFlowInstance.current) {
        console.log('React Flow instance not set');
        return;
      }

      const reactFlowBounds = document.querySelector('.react-flow-wrapper').getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      console.log(`Dropped node type: ${type}`);

      if (!type) {
        console.log('No node type found in dataTransfer');
        return;
      }

      const position = reactFlowInstance.current.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      console.log('Calculated position:', position);

      const nodeTitle = `${type} Node`;
      let nodeStyle = {};

      switch (type) {
        case 'TypeA':
          nodeStyle = {
            backgroundColor: '#FFD700',
            color: '#000',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #222',
            width: '150px',
            textAlign: 'center',
          }; // Gold
          break;
        case 'TypeB':
          nodeStyle = {
            backgroundColor: '#ADFF2F',
            color: '#000',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #222',
            width: '150px',
            textAlign: 'center',
          }; // GreenYellow
          break;
        case 'TypeC':
          nodeStyle = {
            backgroundColor: '#FF69B4',
            color: '#000',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #222',
            width: '150px',
            textAlign: 'center',
          }; // HotPink
          break;
        case 'central':
          nodeStyle = {
            backgroundColor: '#FFF',
            color: '#000',
            padding: '10px',
            borderRadius: '5px',
            border: '2px solid #104E8B',
            width: '150px',
            textAlign: 'center',
          }; // DodgerBlue
          break;
        default:
          nodeStyle = {
            backgroundColor: '#fff',
            color: '#000',
            padding: '10px',
            borderRadius: '5px',
            border: '1px solid #222',
            width: '150px',
            textAlign: 'center',
          }; // Default
      }

      const newNode = {
        id: `${+new Date()}`,
        type: type === 'central' ? 'central' : 'default',
        position,
        data: { label: nodeTitle },
        style: nodeStyle,
      };

      console.log('Adding new node:', newNode);

      setNodes((nds) => [...nds, newNode]);
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
          console.log('Connecting to nearest node:', nearestNode.id);
        }
      }

      console.log('Nodes after addition:', nodes);
    },
    [nodes]
  );
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
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
          {isEditing && (
            <div className="modal">
              <div className="modal-content">
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
              onNodeContextMenu={onNodeContextMenu}
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
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default App;