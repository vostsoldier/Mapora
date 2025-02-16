import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Pricing.css';
import './Home.css';

function Pricing() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <div className="pricing-container">
        <nav className="navbar">
          <div className="logo-title">
            <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
              <span className="title">Think Tree</span>
            </Link>
          </div>
          <div className="nav-links">
            <Link to="/features">Features</Link>
            <Link to="/about">About</Link>
            <Link to="/pricing">Pricing</Link>
          </div>
        </nav>
        <main className="main-content">
          <h1>Pricing</h1>
          <p>Choose the plan that suits your needs.</p>
          <div className="pricing-plans">
            <div className="pricing-plan">
              <h2>Free</h2>
              <p>$0/month</p>
              <ul>
                <li>Basic Features</li>
                <li>Community Support</li>
              </ul>
              <button>Get Started</button>
            </div>
            <div className="pricing-plan">
              <h2>Pro</h2>
              <p>$15/month</p>
              <ul>
                <li>Advanced Features</li>
                <li>Priority Support</li>
                <li>Unlimited Canvases</li>
              </ul>
              <button>Upgrade Now</button>
            </div>
            <div className="pricing-plan">
              <h2>Enterprise</h2>
              <p>Contact Us</p>
              <ul>
                <li>Custom Solutions</li>
                <li>Dedicated Support</li>
                <li>Team Collaboration</li>
              </ul>
              <button>Contact Sales</button>
            </div>
          </div>
        </main>
        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} Think Tree. All rights reserved.</p>
        </footer>
      </div>
    </motion.div>
  );
}

export default Pricing;