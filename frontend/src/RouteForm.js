import React, { useState } from 'react';

const RouteForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    origin: "Om Shiva Shakthi Temple, JP Nagar 7th Phase, Bengaluru",
    destination: "Nexus Mall Koramangala, Bengaluru",
    avoidTolls: false,
    avoidHighways: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '10px',
      zIndex: 1000,
      background: 'white',
      padding: '30px',
      borderRadius: '5px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      maxWidth: '300px'
    }}>
      <h3>Find Routes</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Origin:</label>
          <input
            type="text"
            name="origin"
            value={formData.origin}
            onChange={handleChange}
            style={{ width: '100%', padding: '5px' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Destination:</label>
          <input
            type="text"
            name="destination"
            value={formData.destination}
            onChange={handleChange}
            style={{ width: '100%', padding: '5px' }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ marginRight: '10px' }}>
            <input
              type="checkbox"
              name="avoidTolls"
              checked={formData.avoidTolls}
              onChange={handleChange}
            />
            Avoid Tolls
          </label>
          
          <label>
            <input
              type="checkbox"
              name="avoidHighways"
              checked={formData.avoidHighways}
              onChange={handleChange}
            />
            Avoid Highways
          </label>
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          style={{
            background: '#4285f4',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Loading...' : 'Get Routes'}
        </button>
      </form>
    </div>
  );
};

export default RouteForm;