import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from './api/axios';
import './Home.css'; 

function Signup({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/users/signup', { username, password });
      setMessage('Signup successful! You can now login.');
      navigate('/');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Signup failed.');
    }
  };

  const handleDemo = () => {
    onLogin(null, true);
    navigate('/app');
  };

  return (
    <div className="home-container">
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
      <div className="button-group">
        <button className="btn demo" onClick={handleDemo}>
          Demo
        </button>
      </div>
      <p>
        Already have an account? <a href="/">Login</a>
      </p>
    </div>
  );
}

export default Signup;