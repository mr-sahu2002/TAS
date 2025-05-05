import React from 'react';
import '../styles/Navbar.css';

const Navbar = ({ activeTab, onTabChange }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>TAS</h1>
      </div>
      <div className="navbar-links">
        <button 
          className={`nav-link ${activeTab === 'routes' ? 'active' : ''}`}
          onClick={() => onTabChange('routes')}
        >
          Best Time
        </button>
        <button 
          className={`nav-link ${activeTab === 'news' ? 'active' : ''}`}
          onClick={() => onTabChange('news')}
        >
          Traffic News
        </button>
      </div>
    </nav>
  );
};

export default Navbar; 