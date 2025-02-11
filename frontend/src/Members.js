import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Home.css';
import api from './api/apiWrapper';
<<<<<<< Updated upstream
=======
import axios from 'axios';

>>>>>>> Stashed changes
function Members({ addToast }) { 
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('projects');
  const [canvases, setCanvases] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState('');
  const [newCanvasDescription, setNewCanvasDescription] = useState('');

  useEffect(() => {
    loadCanvases();
  }, []);
<<<<<<< Updated upstream
  const loadCanvases = async () => {
    api.get('/api/canvas')
      .then(response => {
        setCanvases(response.data);
      })
      .catch(error => {
        console.error('Error loading canvases:', error);
        addToast?.('Failed to load canvases', 'error');
      });
  };
  const handleCreateCanvas = async () => {
    if (!newCanvasName.trim()) {
      addToast?.('Please enter a canvas name', 'error');
=======

  const loadCanvases = async () => {
    try {
      const response = await api.get('/canvas');
      setCanvases(response.data);
    } catch (error) {
      console.error('Error loading canvases:', error);
      addToast?.('Failed to load canvases', 'error');
    }
  };

  const handleCreateCanvas = async () => {
    if (!newCanvasName.trim()) {
      alert('Canvas name cannot be empty.');
>>>>>>> Stashed changes
      return;
    }

    try {
<<<<<<< Updated upstream
      const response = await api.post('/api/canvas', {
        name: newCanvasName,
        description: newCanvasDescription
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const newCanvas = response.data;
      setCanvases([...canvases, newCanvas]);
      setIsCreating(false);
      setNewCanvasName('');
      setNewCanvasDescription('');
      addToast?.('Canvas created successfully', 'success');
      navigate(`/app/${newCanvas._id}`);
=======
      const response = await api.post('/canvas', {
        name: newCanvasName,
        description: newCanvasDescription
      });
      navigate(`/app/${response.data._id}`);
      addToast?.('Canvas created successfully!', 'success');
      setNewCanvasName('');
      setNewCanvasDescription('');
      setIsCreating(false);
>>>>>>> Stashed changes
    } catch (error) {
      console.error('Error creating canvas:', error);
      addToast?.('Failed to create canvas', 'error');
    }
  };

  const navigateToCanvas = (canvasId) => {
    navigate(`/app/${canvasId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isDemo');
    navigate('/', { replace: true });
    window.location.reload();
  };

  return (
    <motion.div
      className="dashboard-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <nav className="dashboard-sidebar">
        <div className="logo-section">
          <Link to="/" className="dashboard-logo">Think Tree</Link>
        </div>
        <div className="nav-sections">
          <button 
            className={`nav-item ${activeSection === 'projects' ? 'active' : ''}`}
            onClick={() => setActiveSection('projects')}
          >
            Projects
          </button>
          <button 
            className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            Profile
          </button>
          <button 
            className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveSection('settings')}
          >
            Settings
          </button>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </nav>

      <main className="dashboard-content">
        {activeSection === 'projects' && (
          <section className="projects-section">
            <div className="section-header">
              <h1>Your Projects</h1>
              <button className="new-project-btn" onClick={() => navigate('/app')}>
                New Project
              </button>
            </div>
            <div className="projects-grid">
              <div 
                className="project-card add-new" 
                onClick={() => setIsCreating(true)} 
              >
                <div className="project-card-content">
                  <span className="add-icon">+</span>
                  <h3>Create New Project</h3>
                  <p>Start a new mind map</p>
                </div>
              </div>
              {canvases.map((canvas) => (
                <div 
                  key={canvas._id} 
                  className="project-card"
                  onClick={() => navigateToCanvas(canvas._id)}
                >
                  <h3>{canvas.name}</h3>
                  <p>{canvas.description}</p>
                  <p>Created: {new Date(canvas.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
            {isCreating && (
              <div className="modal" onClick={() => setIsCreating(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                  <h2>Create New Canvas</h2>
                  <input
                    type="text"
                    placeholder="Canvas Name"
                    value={newCanvasName}
                    onChange={(e) => setNewCanvasName(e.target.value)}
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={newCanvasDescription}
                    onChange={(e) => setNewCanvasDescription(e.target.value)}
                  />
                  <div className="modal-actions">
                    <button onClick={handleCreateCanvas}>Create</button>
                    <button onClick={() => setIsCreating(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeSection === 'profile' && (
          <section className="profile-section">
            <h1>Profile</h1>
          </section>
        )}

        {activeSection === 'settings' && (
          <section className="settings-section">
            <h1>Settings</h1>
          </section>
        )}
      </main>
    </motion.div>
  );
}

export default Members;