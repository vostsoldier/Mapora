import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from './api/apiWrapper';
import './Home.css'; 
import featuresImage from './assets/features.webp'; 

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/users/login', { username, password });
      const { token } = response.data;
      setMessage('Login successful!');
      onLogin(token);
      navigate('/app');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Login failed.');
    }
  };

  const handleDemo = () => {
    onLogin(null, true);
    navigate('/app');
  };

  return (
    <motion.div
      className="login-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6 }}
    >
      <Link to="/" className="page-title">Think Tree</Link>
      <div className="form-container">
        <h1 className="product-name">Think Tree - Login</h1>
        <form className="auth-form" onSubmit={handleLogin}>
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
          <button type="submit" className="btn login">
            Login
          </button>
        </form>
        <p className="message">{message}</p>
        <p>
          Don't have an account? <a href="/signup">Signup</a>
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

export default Login;