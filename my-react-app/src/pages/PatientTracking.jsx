import React, { useEffect, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

export default function PatientTracking() {
  const [pos, setPos] = useState([20.59, 78.96]); // default India
  const [hospitals, setHospitals] = useState([]);

  // custom marker icon (fix missing marker issue in leaflet)
  const userIcon = new L.Icon({
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (p) => {
        const coords = [p.coords.latitude, p.coords.longitude];
        setPos(coords);
        fetchNearby(coords[0], coords[1]);
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Could not fetch your location, showing default India map.");
        // still try to fetch hospitals near default India center
        fetchNearby(20.59, 78.96);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  async function fetchNearby(lat, lng) {
    try {
      const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const r = await axios.get(`${API}/api/hospitals/nearby`, {
        params: { lat, lng, radius: 10000 }, // radius in meters
      });
      setHospitals(r.data);
    } catch (err) {
      console.error("Error fetching hospitals:", err);
    }
  }

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "20px auto",
        padding: "20px",
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: "16px" }}>
        🏥 Nearby Hospitals
      </h2>

      <div style={{ height: "70vh", borderRadius: "12px", overflow: "hidden" }}>
        <MapContainer
          center={pos}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
          />
          <Marker position={pos} icon={userIcon}>
            <Popup>You are here 📍</Popup>
          </Marker>

          {hospitals.map((h) => (
            <Marker
              key={h._id}
              position={[
                h.location.coordinates[1],
                h.location.coordinates[0],
              ]}
              icon={userIcon}
            >
              <Popup>
                <b>{h.name}</b>
                <br />
                {h.address}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
