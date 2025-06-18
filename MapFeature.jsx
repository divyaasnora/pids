import { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  LoadScript,
} from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "450px",
};

const defaultCenter = {
  lat: 28.5224,
  lng: 77.2370,
};

const Map = () => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentPosition(pos);
          if (mapRef.current) {
            mapRef.current.panTo(pos);
            mapRef.current.setZoom(16);
          }
        },
        () => {
          alert("Geolocation permission denied or unavailable.");
        }
      );
    } else {
      alert("Your browser doesn't support geolocation.");
    }
  }, []);

  useEffect(() => {
    if (window.google && mapRef.current && currentPosition) {
      const { AdvancedMarkerElement } = window.google.maps.marker;

      
      if (markerRef.current) {
        markerRef.current.map = null;
      }

      
      const content = document.createElement("div");
      content.innerHTML = "📍 You are here";

      
      markerRef.current = new AdvancedMarkerElement({
        map: mapRef.current,
        position: currentPosition,
        content,
      });
    }
  }, [currentPosition]);

  return (
    <LoadScript
      googleMapsApiKey="AIzaSyB69GFlGJuoTIQ4fDKqR2lDLcTm2JYBrUY" 
      libraries={["marker"]}
    >
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentPosition || defaultCenter}
        zoom={14}
        onLoad={(map) => {
          mapRef.current = map;
        }}
      />
    </LoadScript>
  );
};

export default Map;
