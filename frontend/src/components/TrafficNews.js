import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/TrafficNews.css';

const TrafficNews = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/traffic-news');
        setNews(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching traffic news:', err);
        setError('Failed to load traffic news. Please try again later.');
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="traffic-news-container">
        <div className="news-loading">
          <h2>Loading Traffic News...</h2>
          <p>Please wait while we fetch the latest traffic updates.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="traffic-news-container">
        <div className="news-error">
          <h2>Error Loading News</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="traffic-news-container">
      <h2>Traffic News & Alerts</h2>
      <div className="news-grid">
        {news.map((item, index) => (
          <div key={index} className={`news-card impact-${item.impact_level.toLowerCase()}`}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className="news-meta">
              <a 
                href={item.source_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="news-source"
              >
                Source: {item.source}
              </a>
              <span className="news-impact">Impact: {item.impact_level}</span>
            </div>
            <div className="news-timestamp">
              {new Date(item.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrafficNews; 