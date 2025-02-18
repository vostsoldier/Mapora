import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

function Purchase() {
  const navigate = useNavigate();
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [message, setMessage] = useState('');

  const handlePurchase = (e) => {
    e.preventDefault();
    if (!cardNumber || !expiryDate || !cvv) {
      setMessage('Please fill in all payment details.');
      return;
    }
    alert('Plan purchased successfully!');
    navigate('/');
  };

  return (
    <div className="purchase-container">
      <h1>Buy the Pro Plan</h1>
      <form className="payment-form" onSubmit={handlePurchase}>
        <input
          type="text"
          placeholder="Card Number"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          maxLength="16"
        />
        <div className="payment-row">
          <input
            type="text"
            placeholder="MM/YY"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            maxLength="5"
          />
          <input
            type="text"
            placeholder="CVV"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
            maxLength="4"
          />
        </div>
        <button className="btn pay-btn" type="submit">Complete Purchase</button>
      </form>
      <p className="message">{message}</p>
    </div>
  );
}

export default Purchase;