import React from 'react';
import './Home.css';
import axios from 'axios';

function Home({ onLogin }) {
  const handleSignup = () => {
    console.log('Navigate to Signup');
  };

  const handleDemo = () => {
    // Do demo logic here - make sure demo doesnt save - only when refresh but when they close
    onLogin(null, true); // Pass true to indicate demo mode or maybe some other cond maybe
  };

  return (
    <div className="home-container">
      <h1 className="product-name">Think Tree</h1>
      <div className="button-group">
        <button className="btn signup" onClick={handleSignup}>
          Signup
        </button>
        <button className="btn demo" onClick={handleDemo}>
          Demo
        </button>
      </div>
    </div>
  );
}

export default Home;