import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from './api/apiWrapper';
import './Home.css'; 
import featuresImage from './assets/features.webp'; 
import { motion } from 'framer-motion';

function Signup({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/users/signup', { username, password });
      setMessage('Signup successful!');
      const loginResponse = await api.post('/api/users/login', { username, password });
      localStorage.setItem('token', loginResponse.data.token);
      localStorage.removeItem('isDemo'); 
      onLogin(loginResponse.data.token);
      
      navigate('/members');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Signup failed.');
    }
  };

  const handleDemo = () => {
    onLogin(null, true);
    navigate('/app');
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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button type="submit" className="btn signup">
            Signup
          </button>
        </form>
        <p className="message">{message}</p>
        <p>
          Already have an account? <a href="/login">Login</a>
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
    </motion.div>
  );
}

export default Signup;