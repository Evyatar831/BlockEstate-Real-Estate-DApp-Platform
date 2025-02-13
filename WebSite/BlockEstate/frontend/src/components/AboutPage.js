import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AboutPage.css';

const AboutPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('access');
 
  return (
    <div className="about-container">
      <button 
        onClick={() => navigate(isLoggedIn ? '/menu' : '/')}
        className="about-back-button"
      >
        {isLoggedIn ? 'Back to Dashboard' : 'Back to Login'}
      </button>

      <div className="about-header">
        <h1>About BlockEstate</h1>
      </div>
     
      <div className="about-content">
        <section className="about-section">
          <h2>Who We Are</h2>
          <p>BlockEstate is a pioneering blockchain-based platform that revolutionizes real estate transactions 
             through smart contracts. Our system streamlines the property buying and selling process, 
             enhances transparency, and reduces the need for intermediaries.</p>
        </section>

        <section className="about-section">
          <h2>Our Services</h2>
          <div className="services-grid">
            <div className="service-card">
              <h3>Smart Contracts</h3>
              <p>Secure, automated contract creation and execution for real estate transactions.</p>
            </div>
            <div className="service-card">
              <h3>Property Management</h3>
              <p>Digital property listings, transaction tracking, and ownership verification.</p>
            </div>
            <div className="service-card">
              <h3>Secure Payments</h3>
              <p>Automated, blockchain-based payment processing and escrow services.</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Key Benefits</h2>
          <div className="services-grid">
            <div className="service-card">
              <h3>Enhanced Security</h3>
              <p>Blockchain technology ensures secure, tamper-proof transaction records.</p>
            </div>
            <div className="service-card">
              <h3>Transparency</h3>
              <p>Complete visibility into transaction status and history.</p>
            </div>
            <div className="service-card">
              <h3>Efficiency</h3>
              <p>Automated processes reduce transaction time and operational costs.</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Contact Us</h2>
          <div className="contact-info">
            <p>
              <span role="img" aria-label="Email">📧</span> Email: support@blockestate.com
            </p>
            <p>
              <span role="img" aria-label="Phone">📞</span> Phone: (123) 456-7890
            </p>
            <p>
              <span role="img" aria-label="Office">🏢</span> Address: 123 Blockchain Avenue, Tech District
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;