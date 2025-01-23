import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import axios from './api/axios';

function Home({ onLogin }) {
  const navigate = useNavigate();

  const handleSignup = () => {
    navigate('/signup');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleDemo = () => {
    onLogin(null, true); 
    navigate('/app');
  };

  return (
    <div className="home-container">
      <h1 className="product-name">Think Tree</h1>
      <div className="button-group">
        <button className="btn signup" onClick={handleSignup}>
          Signup
        </button>
        <button className="btn login" onClick={handleLogin}>
          Login
        </button>
        <button className="btn demo" onClick={handleDemo}>
          Demo
        </button>
      </div>
    </div>
  );
}

export default Home;