import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';

const PatientTracking = () => {
  const [location, setLocation] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  
  const hospitals = [
    { name: "Rural Hospital 1", latitude: 12.9716, longitude: 77.5946 }, 
    { name: "Rural Hospital 2", latitude: 13.0827, longitude: 80.2707 }, 

  ];

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        findNearbyHospitals(latitude, longitude);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to retrieve your location. Please enable location services.");
      }
    );
  }, []);

  const findNearbyHospitals = (lat, lon) => {
    const nearby = hospitals
      .map(hosp => ({
        ...hosp,
        distance: calculateDistance(lat, lon, hosp.latitude, hosp.longitude)
      }))
      .filter(hosp => hosp.distance <= 50) // Within 50 km, adjust as needed
      .sort((a, b) => a.distance - b.distance);

    setNearbyHospitals(nearby);
  };

  
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
  };

  useEffect(() => {
    if (location && uid) {
      fetch(`http://localhost:5000/api/users/${uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: { lat: location.latitude, lon: location.longitude } }),
      })
        .catch(err => console.error("Failed to update location:", err));
    }
  }, [location, uid]);

  return (
    <div className="tracking-container">
      <h2>Patient Location Tracking</h2>
      {location ? (
        <p>Your location: {location.latitude}, {location.longitude}</p>
      ) : (
        <p>Locating you...</p>
      )}
      <h3>Nearby Hospitals</h3>
      {nearbyHospitals.length > 0 ? (
        <ul>
          {nearbyHospitals.map((hosp, index) => (
            <li key={index}>
              {hosp.name} - {hosp.distance.toFixed(2)} km
            </li>
          ))}
        </ul>
      ) : (
        <p>No hospitals within 50 km or location not yet determined.</p>
      )}
    </div>
  );
};

export default PatientTracking;