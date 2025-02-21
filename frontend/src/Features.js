import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import FadeInSection from './components/FadeInSection';
import './Home.css';

function Features() {
  return (
    <motion.div
      className="home-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <nav className="navbar">
        <div className="logo-title">
          <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
            <span className="title">Mapora</span>
          </Link>
        </div>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/pricing">Pricing</Link>
        </div>
      </nav>

      <main className="main-content">
        <FadeInSection>
          <section className="features-section">
            <h1>Features</h1>
            <div className="features">
              <div className="feature-item">
                <h3>Interactive Node System</h3>
                <p>Create, connect, and organize your thoughts with our intuitive node-based interface.</p>
              </div>
              <div className="feature-item">
                <h3>Customizable Connections</h3>
                <p>Create bidirectional flows, reverse animations, and style your connection edges.</p>
              </div>
              <div className="feature-item">
                <h3>Box Elements</h3>
                <p>Group related nodes using resizable box containers for better organization.</p>
              </div>
            </div>
          </section>
        </FadeInSection>

        <FadeInSection>
          <section className="features-section">
            <h2>Advanced Features</h2>
            <div className="features">
              <div className="feature-item">
                <h3>Node Labels</h3>
                <p>Add custom labels with color coding for better visual organization.</p>
              </div>
              <div className="feature-item">
                <h3>Real-time Saving</h3>
                <p>Auto-saves your work with visual confirmation for peace of mind.</p>
              </div>
              <div className="feature-item">
                <h3>Demo Mode</h3>
                <p>Try out all features instantly without registration.</p>
              </div>
            </div>
          </section>
        </FadeInSection>
      </main>

      <footer className="footer">
        <p>&copy; 2024 Mapora. All rights reserved.</p>
      </footer>
    </motion.div>
  );
}

export default Features;