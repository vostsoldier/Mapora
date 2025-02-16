import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import FadeInSection from './components/FadeInSection';
import './Home.css';

function About() {
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
            <span className="title">Think Tree</span>
          </Link>
        </div>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/features">Features</Link>
        </div>
      </nav>

      <main className="main-content">
        <FadeInSection>
          <section className="about-section">
            <h1>About Think Tree</h1>
            <div className="about-content">
              <h2>Our Mission</h2>
              <p>
                Think Tree was created with a simple yet powerful mission: to help people visualize and organize their thoughts in a natural, intuitive way. We believe that ideas should flow as freely as thoughts themselves.
              </p>
            </div>
          </section>
        </FadeInSection>

        <FadeInSection>
          <section className="about-section">
            <h2>Why Think Tree?</h2>
            <div className="about-content">
              <p>
                Traditional note-taking and mind-mapping tools often feel restrictive and linear. Think Tree breaks these boundaries by offering a fluid, dynamic space where ideas can branch out naturally, just like the neural pathways in our minds.
              </p>
            </div>
          </section>
        </FadeInSection>

        <FadeInSection>
          <section className="about-section">
            <h2>Our Values</h2>
            <div className="values-grid">
              <div className="value-item">
                <h3>Simplicity</h3>
                <p>Clean, intuitive interface that stays out of your way.</p>
              </div>
              <div className="value-item">
                <h3>Flexibility</h3>
                <p>Adapt the tool to your thinking style, not the other way around.</p>
              </div>
              <div className="value-item">
                <h3>Innovation</h3>
                <p>Constantly evolving to better serve your creative process.</p>
              </div>
            </div>
          </section>
        </FadeInSection>
      </main>

      <footer className="footer">
        <p>&copy; 2024 Think Tree. All rights reserved.</p>
      </footer>
    </motion.div>
  );
}

export default About;