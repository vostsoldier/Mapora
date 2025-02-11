import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api/apiWrapper';

function CreateCanvas() {
  const [canvasName, setCanvasName] = useState('');
  const navigate = useNavigate();

  const handleCreateCanvas = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/canvas', { name: canvasName });
      const { _id } = response.data;
      navigate(`/app/${_id}`);
    } catch (error) {
      console.error('Error creating canvas:', error);
    }
  };

  return (
    <form onSubmit={handleCreateCanvas}>
      <input 
        type="text"
        value={canvasName}
        onChange={(e) => setCanvasName(e.target.value)}
        placeholder="Enter canvas name"
        required
      />
      <button type="submit">Create Canvas</button>
    </form>
  );
}

export default CreateCanvas;