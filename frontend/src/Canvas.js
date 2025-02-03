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
        setNodes(response.data.nodes);
        setEdges(response.data.edges);
      } catch (error) {
        console.error('Error fetching canvas:', error);
      }
    };

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