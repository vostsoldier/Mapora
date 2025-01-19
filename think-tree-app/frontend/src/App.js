import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  ReactFlowProvider,
  Handle,
} from 'react-flow-renderer';
import axios from 'axios';
import './App.css';

const nodeTypesList = [
  { type: 'leaf', label: 'Type A' },
  { type: 'leaf', label: 'Type B' },
  { type: 'leaf', label: 'Type C' },
];

const initialNodes = [];
const initialEdges = [];

const LeafNode = ({ data }) => (
  <div className="leaf-node">
    <strong>{data.label}</strong>
    <Handle type="source" position="bottom" />
  </div>
);

const BranchNode = ({ data }) => (
  <div className="branch-node">
    <strong>{data.label}</strong>
    <Handle type="target" position="top" />
    <Handle type="source" position="bottom" />
  </div>
);

const nodeTypes = {
  leaf: LeafNode,
  branch: BranchNode,
};

function Sidebar() {
  const onDragStart = (event, nodeType, label) => {
    event.dataTransfer.setData(
      'application/reactflow',
      JSON.stringify({ type: nodeType, label })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside>
      <div className="description">Drag these nodes to the canvas:</div>
      {nodeTypesList.map((node, index) => (
        <div
          key={index}
          className="dndnode"
          onDragStart={(event) => onDragStart(event, node.type, node.label)}
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
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [nodeTitle, setNodeTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchTree();
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
          type: node.type || 'branch',
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
        title: 'Central Branch',
        content: '',
        parentId: null,
        position: { x: 250, y: 250 },
        type: 'branch',
      });
      const newNode = response.data;
      flowNodes.push({
        id: newNode._id,
        data: { label: newNode.title },
        position: newNode.position,
        type: newNode.type || 'branch',
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

  const onLoadHandler = (rfi) => setReactFlowInstance(rfi);

  const saveTree = async () => {
    if (reactFlowInstance) {
      const flow = reactFlowInstance.toObject();
      const nodesData = flow.nodes.map((node) => ({
        _id: node.id,
        title: node.data.label,
        content: '',
        parent: edges.find((edge) => edge.target === node.id)?.source || null,
        position: node.position,
        type: node.type || 'branch',
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
    try {
      const response = await axios.post('/api/thinking-trees', {
        title: 'New Branch',
        content: '',
        parentId: null,
        position: { x: 300, y: 300 },
        type: 'branch',
      });
      const newNode = response.data;
      setNodes((nds) => [
        ...nds,
        {
          id: newNode._id,
          data: { label: newNode.title },
          position: newNode.position,
          type: newNode.type || 'branch',
        },
      ]);
    } catch (error) {
      console.error('Error adding node:', error);
      alert('Failed to add node.');
    }
  };

  const onDrop = useCallback(
    async (event) => {
      event.preventDefault();
      console.log('onDrop event triggered');

      if (!reactFlowInstance) {
        console.warn('ReactFlowInstance is null');
        return;
      }

      const reactFlowBounds = document.querySelector('.react-flow-wrapper').getBoundingClientRect();
      const data = event.dataTransfer.getData('application/reactflow');
      if (!data) {
        console.warn('Invalid node data dropped');
        return;
      }

      const { type, label } = JSON.parse(data);

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });
      console.log('Calculated position:', position);

      try {
        const response = await axios.post('/api/thinking-trees', {
          title: label,
          content: '',
          parentId: null,
          position: position,
          type: type, 
        });

        const newNode = response.data;
        console.log('Received new node from backend:', newNode);
        setNodes((nds) =>
          nds.concat({
            id: newNode._id,
            data: { label: newNode.title },
            position: newNode.position,
            type: newNode.type || 'leaf',
          })
        );
        if (nodes.length > 0) {
          const nearestNode = nodes.find(
            (node) =>
              Math.abs(node.position.x - position.x) < 100 &&
              Math.abs(node.position.y - position.y) < 100 &&
              node.type === 'branch'
          );
          if (nearestNode) {
            const newEdge = {
              id: `e${nearestNode.id}_to_${newNode._id}`,
              source: nearestNode.id,
              target: newNode._id,
              animated: true,
            };
            console.log('Creating new edge:', newEdge);
            setEdges((eds) => addEdge(newEdge, eds));
          }
        }
      } catch (error) {
        console.error('Error adding leaf:', error);
        alert('Failed to add leaf.');
      }
    },
    [nodes, reactFlowInstance]
  );

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
              <button className="btn" onClick={addNode}>
                Add Branch
              </button>
              <button className="btn" onClick={saveTree}>
                Save Tree
              </button>
            </div>
          </header>
          <div className="react-flow-wrapper" onDrop={onDrop} onDragOver={onDragOver}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnectHandler}
              onElementsRemove={onElementsRemoveHandler}
              onLoad={onLoadHandler}
              deleteKeyCode={46} 
              snapToGrid={true}
              snapGrid={[15, 15]}
              fitView
              nodeTypes={nodeTypes} 
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