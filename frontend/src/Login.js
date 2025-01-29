import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api/apiWrapper';
import './Home.css'; 

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
    <div className="home-container">
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
      <div className="button-group">
        <button className="btn demo" onClick={handleDemo}>
          Demo
        </button>
      </div>
      <p>
        Don't have an account? <a href="/signup">Signup</a>
      </p>
    </div>
  );
}

export default Login;