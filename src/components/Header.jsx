import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleAccountClick = () => {
    navigate('/account');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header" style={{ justifyContent: 'space-between'}}>
      <div>Welcome, {user?.username || 'Guest'}</div>
      <div className='button-container'>
        <button onClick={handleAccountClick}>Account</button>
        <button onClick={handleLogout} style={{ marginLeft: '10px' }}>Logout</button>
      </div>
    </header>
  );
};

export default Header;