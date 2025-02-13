<<<<<<< HEAD

=======
// Updated MenuPage.js for real estate
>>>>>>> efe802b92673bfcb2b00250be6a6b08bc6b3b6aa
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MenuPage.css';

const MenuPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access');
    navigate('/');
  };

  return (
    <div className="menu-container">
      <div className="header">
        <h1>Welcome to Real Estate Portal</h1>
        <div className="header-buttons">
          <button className="profile-button" onClick={() => navigate('/profile')}>My Profile</button>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="real-estate-options">
        <div className="option-card" onClick={() => navigate('/buy')}>
          <h2>Buy Property</h2>
          <p>Explore available properties for sale.</p>
        </div>
        <div className="option-card" onClick={() => navigate('/sell')}>
          <h2>Sell Property</h2>
          <p>List your property for potential buyers.</p>
        </div>
      </div>
    </div>
  );
};

export default MenuPage;
