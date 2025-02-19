import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Home.css';
import api from './api/apiWrapper';
import axios from 'axios';

function Members({ addToast }) { 
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('projects');
  const [canvases, setCanvases] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState('');
  const [newCanvasDescription, setNewCanvasDescription] = useState('');
  const [menuCanvasId, setMenuCanvasId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCanvasId, setEditingCanvasId] = useState(null);
  const [editedCanvasName, setEditedCanvasName] = useState('');
  const [invitations, setInvitations] = useState([]);
  const authToken = localStorage.getItem('token');

  useEffect(() => {
    loadCanvases();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      loadCanvases();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    const loadInvitations = async () => {
      try {
        const response = await api.get('/invitations', {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setInvitations(response.data);
      } catch (error) {
        console.error('Error loading invitations:', error);
        addToast('Failed to load invitations', 'error');
      }
    };
    loadInvitations();
  }, [authToken, addToast]);

  const loadCanvases = async () => {
    try {
      const response = await api.get('/canvas');
      setCanvases(response.data);
    } catch (error) {
      console.error('Error loading canvases:', error);
      addToast?.('Failed to load canvases', 'error');
    }
  };

  const handleCreateCanvas = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/canvas', { 
        name: newCanvasName, 
        description: newCanvasDescription 
      });
      const createdCanvas = response.data;
      const id = createdCanvas._id || createdCanvas.canvasId;
      if (!id) {
        console.warn('Canvas id is missing:', response.data);
        return;
      }
      setCanvases((prev) => [...prev, createdCanvas]);
      navigate(`/app/${id}`);
    } catch (error) {
      console.error('Error creating canvas:', error);
      addToast?.('Failed to create canvas', 'error');
    }
  };

  const handleDeleteCanvas = async (canvasId) => {
    try {
      await api.delete(`/canvas/${canvasId}`);
      setCanvases(canvases.filter((canvas) => canvas._id !== canvasId));
      addToast?.('Canvas deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting canvas:', error);
      addToast?.('Failed to delete canvas', 'error');
    }
    setMenuCanvasId(null);
  };

  const handleOpenEdit = (canvas) => {
    setEditingCanvasId(canvas._id);
    setEditedCanvasName(canvas.name);
    setIsEditing(true);
    setMenuCanvasId(null);
  };

  const handleEditCanvas = async () => {
    if (!editedCanvasName.trim()) {
      addToast?.('Canvas name cannot be empty', 'error');
      return;
    }
    try {
      const response = await api.put(`/canvas/${editingCanvasId}`, { name: editedCanvasName });
      const updatedCanvas = response.data;
      setCanvases(
        canvases.map((canvas) =>
          canvas._id === editingCanvasId ? updatedCanvas : canvas
        )
      );
      addToast?.('Canvas updated successfully', 'success');
    } catch (error) {
      console.error('Error updating canvas:', error);
      addToast?.('Failed to update canvas', 'error');
    }
    setIsEditing(false);
    setEditingCanvasId(null);
    setEditedCanvasName('');
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

  const handleAccept = async (invitationId) => {
    try {
      await api.put(`/invitations/${invitationId}/accept`, {}, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setInvitations(invitations.filter(inv => inv._id !== invitationId));
      addToast('Invitation accepted', 'success');
    } catch (error) {
      addToast('Failed to accept invitation', 'error');
    }
  };

  const handleReject = async (invitationId) => {
    try {
      await api.delete(`/invitations/${invitationId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setInvitations(invitations.filter(inv => inv._id !== invitationId));
      addToast('Invitation rejected', 'success');
    } catch (error) {
      addToast('Failed to reject invitation', 'error');
    }
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
          <Link to="/" className="dashboard-logo">Mapora</Link>
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
                <div key={canvas._id} className="project-card">
                  <div 
                    className="project-card-content" 
                    onClick={() => navigateToCanvas(canvas._id)}
                  >
                    <h3>{canvas.name}</h3>
                    <p>{canvas.description}</p>
                    <p>Created: {new Date(canvas.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="project-card-menu">
                    <button onClick={() => setMenuCanvasId(canvas._id)}>
                      &#8942;
                    </button>
                    {menuCanvasId === canvas._id && (
                      <div className="menu-dropdown">
                        <div 
                          className="menu-item" 
                          onClick={() => handleOpenEdit(canvas)}
                        >
                          Edit
                        </div>
                        <div 
                          className="menu-item" 
                          onClick={() => handleDeleteCanvas(canvas._id)}
                        >
                          Delete
                        </div>
                      </div>
                    )}
                  </div>
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
            {isEditing && (
              <div className="modal" onClick={() => setIsEditing(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>Edit Canvas Name</h2>
                  <input
                    type="text"
                    value={editedCanvasName}
                    onChange={(e) => setEditedCanvasName(e.target.value)}
                    placeholder="Enter new canvas name"
                  />
                  <div className="modal-actions">
                    <button onClick={handleEditCanvas}>Save</button>
                    <button onClick={() => setIsEditing(false)}>Cancel</button>
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

        <section className="invitations-section">
          <h2>Invitations</h2>
          {invitations.length === 0 && <p>No pending invitations.</p>}
          {invitations.map(inv => (
            <div key={inv._id} className="invitation-item">
              <p>
                You have been invited to collaborate on canvas ID: {inv.canvasId}
              </p>
              <button onClick={() => handleAccept(inv._id)}>Accept</button>
              <button onClick={() => handleReject(inv._id)}>Reject</button>
            </div>
          ))}
        </section>
      </main>
    </motion.div>
  );
}

export default Members;