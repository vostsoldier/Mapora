import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from './api/apiWrapper';
import './Home.css';
import featuresImage from './assets/features.webp';
import { motion } from 'framer-motion';
import TermsModal from './components/TermsModal';
import PrivacyPolicyModal from './components/PrivacyPolicyModal';

function Signup({ onLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      setMessage('You must accept the Terms of Service to sign up.');
      return;
    }
    try {
      const response = await api.post('/users/signup', { username, email, password });
      setMessage('Signup successful!');
      const loginResponse = await api.post('/users/login', { username, password });
      localStorage.setItem('token', loginResponse.data.token);
      localStorage.removeItem('isDemo'); 
      onLogin(loginResponse.data.token);
      navigate('/members');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Signup failed.');
    }
  };

  return (
    <motion.div
      className="signup-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <Link to="/" className="page-title">Think Tree</Link>
      <div className="form-container">
        <h1 className="product-name">Think Tree - Signup</h1>
        <form className="auth-form" onSubmit={handleSignup}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <div className="terms-checkbox">
            <input 
              type="checkbox" 
              id="terms" 
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <label htmlFor="terms">
              I accept the <span className="terms-link" onClick={() => setShowTermsModal(true)}>Terms of Service</span>
            </label>
          </div>
          <div className="privacy-link-container">
            <span className="privacy-link" onClick={() => setShowPrivacyModal(true)}>
              Read our Privacy Policy
            </span>
          </div>
          <button type="submit" className="btn signup">
            Signup
          </button>
        </form>
        <p className="message">{message}</p>
        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
      <div className="content-container">
        <h2>Features</h2>
        <ul>
          <li>Organize your thoughts seamlessly.</li>
          <li>Collaborate in real-time with your team.</li>
          <li>Secure and reliable data storage.</li>
          <li>Intuitive and user-friendly interface.</li>
        </ul>
        <img src={featuresImage} alt="Features" /> 
      </div>
      {showTermsModal && <TermsModal onClose={() => setShowTermsModal(false)} />}
      {showPrivacyModal && <PrivacyPolicyModal onClose={() => setShowPrivacyModal(false)} />}
    </motion.div>
  );
}

export default Signup;