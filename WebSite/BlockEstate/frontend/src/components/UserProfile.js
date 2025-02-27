import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserProfile.css';

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/api/user/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access')}`
      }
    })
    .then(res => res.json())
    .then(data => {
      setUser(data);
    });
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/user/change-password/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access')}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to change password');
    }
  };

  return (
    <div className="profile-container">
      <button 
        onClick={() => navigate('/menu')}
        className="back-button"
      >
        Back to Menu
      </button>

      <div className="header">
        <h1>User Profile</h1>
      </div>

      <div className="profile-card">
        {error && (
          <div className="error-message">
            {error.split('\n').map((line, index) => (
              <p key={index} style={{ margin: line.startsWith('•') ? '0 0 0 20px' : '0 0 10px 0' }}>
                {line}
              </p>
            ))}
          </div>
        )}
        {success && <div className="success-message">{success}</div>}

        {!isChangingPassword ? (
          <>
            <div className="profile-info">
              <div className="info-group">
                <label>Username:</label>
                <p>{user?.username}</p>
              </div>
              <div className="info-group">
                <label>Email:</label>
                <p>{user?.email}</p>
              </div>
              <div className="button-group">
                <button 
                  className="password-button"
                  onClick={() => setIsChangingPassword(true)}
                >
                  Change Password
                </button>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="profile-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>

            <div className="button-group">
              <button type="submit" className="save-button">
                Change Password
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => {
                  setIsChangingPassword(false);
                  setError('');
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserProfile;