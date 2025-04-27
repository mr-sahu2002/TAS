import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";
import RouteForm from './RouteForm';

const api_Key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const App = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  
  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      points.push([lng / 1e5, lat / 1e5]);
    }

    return points;
  };

  const fetchRoutes = async (formData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:8000/api/routes', {
        origin: formData.origin,
        destination: formData.destination,
        avoid_tolls: formData.avoidTolls,
        avoid_highways: formData.avoidHighways
      });
      
      setRoutes(response.data);
      displayRoutes(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching routes:", err);
      setError("Failed to fetch routes. Please try again later.");
      setLoading(false);
    }
  };

  const displayRoutes = (routesData) => {
    if (!mapInstance.current) return;
    
    // Clear previous routes
    mapInstance.current.data.forEach(feature => {
      mapInstance.current.data.remove(feature);
    });
    
    // Create GeoJSON object for the routes
    const geoJson = {
      type: "FeatureCollection",
      features: routesData.map((route, index) => ({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: decodePolyline(route.polyline)
        },
        properties: {
          name: `Route ${index + 1}`,
          distance: route.distance,
          duration: route.duration
        }
      }))
    };

    // Add routes to the map
    mapInstance.current.data.addGeoJson(geoJson);
    
    // If we have routes, zoom and center the map to fit them
    if (routesData.length > 0 && geoJson.features.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      // Get coordinates from the first route to set bounds
      const coordinates = decodePolyline(routesData[0].polyline);
      coordinates.forEach(point => {
        bounds.extend(new window.google.maps.LatLng(point[1], point[0]));
      });
      
      mapInstance.current.fitBounds(bounds);
    }
  };

  useEffect(() => {
    const initMap = () => {
      // Create map instance
      mapInstance.current = new window.google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: 12.9716, lng: 77.5946 }, // Bangalore center
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true
      });

      // Style routes with different colors
      mapInstance.current.data.setStyle(function(feature) {
        const routeIndex = parseInt(feature.getProperty('name').split(' ')[1]) - 1;
        const colors = ['#4285F4', '#DB4437', '#0F9D58']; // Google Map colors: Blue, Red, Green
        
        return {
          strokeColor: colors[routeIndex % colors.length],
          strokeWeight: 6,
          strokeOpacity: 0.8
        };
      });

      // Add click listener for routes
      mapInstance.current.data.addListener("click", function (event) {
        const name = event.feature.getProperty("name");
        const distance = event.feature.getProperty("distance");
        const duration = event.feature.getProperty("duration");
        
        // Create info window at clicked location
        const infoWindow = new window.google.maps.InfoWindow({
          content: `<div><strong>${name}</strong><br>Distance: ${distance}<br>Duration: ${duration}</div>`,
          position: event.latLng
        });
        
        infoWindow.open(mapInstance.current);
      });
    };

    // Load Google Maps API
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${api_Key}&callback=initGoogleMaps`;
      script.async = true;
      
      window.initGoogleMaps = () => {
        initMap();
      };
      
      document.head.appendChild(script);
    } else {
      initMap();
    }
    
  }, []);

  return (
    <div>
      <RouteForm onSubmit={fetchRoutes} isLoading={loading} />
      
      {error && (
        <div style={{
          position: 'absolute', 
          top: '10px', 
          right: '10px', 
          zIndex: 1000, 
          background: '#ffdddd', 
          padding: '10px', 
          borderRadius: '5px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}>
          {error}
        </div>
      )}
      
      <div ref={mapRef} style={{ height: '100vh', width: '100%' }}></div>
    </div>
  );
};

export default App;