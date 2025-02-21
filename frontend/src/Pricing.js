import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Pricing.css';
import './Home.css';

function Pricing() {
  const navigate = useNavigate();

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
              <span className="title">Mapora</span>
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
              <h2>Personal</h2>
              <p>$0/month</p>
              <ul>
                <li><strong>Active Projects:</strong> Up to 3 active projects</li>
                <li><strong>Nodes per Project:</strong> 30–50 nodes</li>
                <li><strong>Export Capabilities:</strong> Standard resolution PNG exports</li>
                <li><strong>Task Management:</strong> Limited auto-updating & smart routing</li>
                <li><strong>Collaboration:</strong> Restricted live collaboration sessions</li>
                <li><strong>Integrations:</strong> Basic or no third-party integrations</li>
                <li><strong>Support:</strong> Community support and basic help center</li>
              </ul>
              <button onClick={() => navigate('/signup')}>Get Started</button>
            </div>
            <div className="pricing-plan">
              <h2>Pro</h2>
              <p>$15/month</p>
              <ul>
                <li><strong>Active Projects:</strong> Unlimited active projects</li>
                <li><strong>Nodes per Project:</strong> Unlimited nodes per project</li>
                <li><strong>Export Capabilities:</strong> High-resolution exports (PNG, SVG, PDF, etc.)</li>
                <li><strong>Task Management:</strong> Full auto-updating & unlimited smart routing</li>
                <li><strong>Collaboration:</strong> Unlimited real-time collaboration</li>
                <li><strong>Integrations:</strong> Full integration with external tools</li>
                <li><strong>Support:</strong> Priority support with onboarding assistance</li>
              </ul>
              <button onClick={() => navigate('/purchase')}>Upgrade Now</button>
            </div>
          </div>
          <section className="feature-comparison">
            <h2>Feature Comparison</h2>
            <table>
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Free Tier</th>
                  <th>Paid Tier</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Active Projects</td>
                  <td>Up to 3 active projects</td>
                  <td>Unlimited active projects</td>
                </tr>
                <tr>
                  <td>Nodes per Project</td>
                  <td>30–50 nodes</td>
                  <td>Unlimited nodes</td>
                </tr>
                <tr>
                  <td>Export Capabilities</td>
                  <td>Standard resolution PNG exports</td>
                  <td>High-resolution exports (PNG, SVG, PDF, etc.)</td>
                </tr>
                <tr>
                  <td>Auto-Updating Dependencies</td>
                  <td>Limited or not available</td>
                  <td>Full automation features</td>
                </tr>
                <tr>
                  <td>Smart Task Routing</td>
                  <td>Limited feature usage</td>
                  <td>Unlimited smart routing</td>
                </tr>
                <tr>
                  <td>Real-Time Collaboration</td>
                  <td>Restricted live sessions</td>
                  <td>Unlimited live collaboration</td>
                </tr>
                <tr>
                  <td>Notifications & Reminders</td>
                  <td>Basic notifications</td>
                  <td>Advanced scheduling and integrations</td>
                </tr>
                <tr>
                  <td>External Tool Integrations</td>
                  <td>Limited or none</td>
                  <td>Full integration capabilities</td>
                </tr>
                <tr>
                  <td>Support & Customization</td>
                  <td>Community support / Basic help center</td>
                  <td>Priority support and customization options</td>
                </tr>
              </tbody>
            </table>
          </section>
        </main>
        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} Mapora. All rights reserved.</p>
        </footer>
      </div>
    </motion.div>
  );
}

export default Pricing;