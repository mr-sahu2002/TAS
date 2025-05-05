import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";
import RouteForm from './components/RouteForm';
import TrafficGraph from './components/TrafficGraph';
import Navbar from './components/Navbar';
import TrafficNews from './components/TrafficNews';
import './styles/App.css';
import { faBus } from "@fortawesome/free-solid-svg-icons";

const api_Key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const App = () => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [trafficData, setTrafficData] = useState(null);
  const [formData, setFormData] = useState(null);
  const [activeTab, setActiveTab] = useState('routes');
  const [isMapInitialized, setIsMapInitialized] = useState(false);
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
    setFormData(formData);
    
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

  const fetchTrafficData = async (routeIndex) => {
    if (!formData) return;
    
    try {
      const response = await axios.get(`http://localhost:8000/api/traffic/${routeIndex}`, {
        params: {
          origin: formData.origin,
          destination: formData.destination
        }
      });
      
      setTrafficData(response.data);
      setSelectedRoute(routeIndex);
    } catch (err) {
      console.error("Error fetching traffic data:", err);
      setError("Failed to fetch traffic data. Please try again later.");
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

      // Add start and end markers
      const startPoint = coordinates[0];
      const endPoint = coordinates[coordinates.length - 1];

      // Start marker (green circle)
      new window.google.maps.Marker({
        position: { lat: startPoint[1], lng: startPoint[0] },
        map: mapInstance.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#4CAF50",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
          scale: 8
        },
        title: "Start Point"
      });

      // End marker (red circle)
      new window.google.maps.Marker({
        position: { lat: endPoint[1], lng: endPoint[0] },
        map: mapInstance.current,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#F44336",
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#ffffff",
          scale: 8
        },
        title: "End Point"
      });
      
      mapInstance.current.fitBounds(bounds);
    }
  };

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current) return;

      try {
        // Create map instance
        mapInstance.current = new window.google.maps.Map(mapRef.current, {
          zoom: 12,
          center: { lat: 12.9716, lng: 77.5946 }, // Bangalore center
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true
        });

        // Add traffic congestion point markers
        const congestionPoints = [
          { lat: 12.9716, lng: 77.5946, title: "MG Road Junction" },
          { lat: 12.9784, lng: 77.6408, title: "Indiranagar Junction" },
          { lat: 12.9784, lng: 77.6408, title: "Koramangala Junction" },
          { lat: 12.9784, lng: 77.6408, title: "Silk Board Junction" },
          { lat: 12.9784, lng: 77.6408, title: "Marathahalli Junction" }
        ];

        congestionPoints.forEach(point => {
          new window.google.maps.Marker({
            position: { lat: point.lat, lng: point.lng },
            map: mapInstance.current,
            title: point.title,
            label: {
              text: "!",
              color: "#ffffff",
              fontSize: "14px",
              fontWeight: "bold"
            }
          });
        });

        // Style routes with different colors
        mapInstance.current.data.setStyle(function(feature) {
          const routeIndex = parseInt(feature.getProperty('name').split(' ')[1]) - 1;
          const colors = ['#4285F4', '#DB4437', '#0F9D58']; // Google Map colors: Blue, Red, Green
          
          return {
            strokeColor: colors[routeIndex % colors.length],
            strokeWeight: 6,
            strokeOpacity: 0.8,
            zIndex: -1
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

        setIsMapInitialized(true);
      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Failed to initialize map. Please refresh the page.');
      }
    };

    // Load Google Maps API
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${api_Key}&libraries=places&v=weekly`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        window.initGoogleMaps = initMap;
        initMap();
      };
      
      document.head.appendChild(script);
    } else {
      initMap();
    }
    
    return () => {
      if (mapInstance.current) {
        mapInstance.current = null;
      }
    };
  }, []);

  // Handle tab changes
  useEffect(() => {
    if (!isMapInitialized || !mapRef.current || !mapInstance.current) return;

    if (activeTab === 'routes') {
      mapRef.current.style.display = 'block';
      // Trigger resize to ensure map renders properly
      setTimeout(() => {
        if (mapInstance.current) {
          window.google.maps.event.trigger(mapInstance.current, 'resize');
        }
      }, 100);
    } else {
      mapRef.current.style.display = 'none';
    }
  }, [activeTab, isMapInitialized]);

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'routes' ? (
        <>
          <RouteForm onSubmit={fetchRoutes} isLoading={loading} />
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div ref={mapRef} className="map-container" style={{ display: activeTab === 'routes' ? 'block' : 'none' }}></div>
          
          {routes.length > 0 && (
            <div className="routes-container">
              <h3>Available Routes</h3>
              <div className="routes-list">
                {routes.map((route, index) => (
                  <div 
                    key={index} 
                    className={`route-item ${selectedRoute === index ? 'selected' : ''}`}
                    onClick={() => fetchTrafficData(index)}
                  >
                    <h4>Route {index + 1}</h4>
                    <p>Distance: {route.distance}</p>
                    <p>Duration: {route.duration}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {trafficData && selectedRoute !== null && (
            <TrafficGraph 
              routeData={trafficData} 
              selectedRoute={selectedRoute} 
            />
          )}
        </>
      ) : (
        <TrafficNews />
      )}
    </div>
  );
};

export default App;