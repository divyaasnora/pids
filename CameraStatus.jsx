import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { Link } from "react-router-dom";
import CameraAltIcon from "@mui/icons-material/CameraAlt";

const socket = io("http://localhost:8081");

const CameraStatus = () => {
  const [cameraData, setCameraData] = useState({});
  const [videoStreams, setVideoStreams] = useState({});
  const [alerts, setAlerts] = useState([]);
  const videoRefs = useRef({});

  useEffect(() => {
     axios
      .get("http://localhost:8081/api/camera-status")
      .then((res) => setCameraData(res.data || {}))
      .catch((err) => console.error("Error fetching camera status:", err));

    
    axios
      .get("http://localhost:8081/api/camera-streams")
      .then((res) => {
        console.log("Camera streams data:", res.data);
        setVideoStreams(res.data);
      })
      .catch((error) => {
        console.error(
          "Error fetching camera streams:",
          error.response ? error.response.data : error.message
        );
      });

    
    const handleCameraUpdate = (newData) => {
      if (newData && typeof newData === "object") {
        setCameraData(newData);
      }
    };

    const handleNewAlert = (alert) => {
      if (alert) {
        setAlerts((prevAlerts) => [...prevAlerts, alert]);
      }
    };

    socket.on("camera-update", handleCameraUpdate);
    socket.on("new-alert", handleNewAlert);

    return () => {
      socket.off("camera-update", handleCameraUpdate);
      socket.off("new-alert", handleNewAlert);
    };
  }, []);

  const togglePlayPause = (camera) => {
    const video = videoRefs.current[camera];
    if (video) {
      if (video.paused) {
        video.play().catch((error) =>
          console.error("Error playing video:", error)
        );
      } else {
        video.pause();
      }
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Real-Time Camera Monitoring</h1>

      <div style={styles.cameraGrid}>
        {Object.keys(cameraData).length > 0 ? (
          Object.entries(cameraData).map(([camera, status]) => (
            <div key={camera} style={styles.cameraBox}>
              <CameraAltIcon
                style={{
                  fontSize: "40px",
                  color: "#0077b6",
                  marginBottom: "10px",
                }}
              />
              <div
                style={{
                  ...styles.statusLight,
                  backgroundColor: status ? "green" : "red",
                  transition: "background-color 0.5s, transform 0.5s",
                  transform: status ? "scale(1.2)" : "scale(1)",
                }}
              ></div>
              <p style={styles.cameraText}>
                {camera} - {status ? "Online" : "Offline"}
              </p>

              {status && videoStreams[camera] ? (
                <video
                  ref={(el) => (videoRefs.current[camera] = el)}
                  src={videoStreams[camera] || ""}
                  controls
                  autoPlay
                  muted
                  style={styles.video}
                  onError={(e) => console.error("Video error:", e)}
                />
              ) : (
                <p style={styles.offlineText}>No Live Feed</p>
              )}

              {status && (
                <div style={styles.controls}>
                  <button onClick={() => togglePlayPause(camera)}>
                    Play/Pause
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p>Loading cameras...</p>
        )}
      </div>

      <h2>Motion Alerts</h2>
      <div style={styles.alertBox}>
        {alerts.length === 0 ? (
          <p>No Alerts</p>
        ) : (
          alerts.map((alert, index) => (
            <p key={index}>
              🚨 Camera: {alert.cameraID} | Time:{" "}
              {new Date(alert.timestamp).toLocaleString()} | Status:{" "}
              {alert.received ? "Received" : "Pending"}
            </p>
          ))
        )}
      </div>

      <button style={styles.button}>
        <Link to="/" style={styles.link}>
          Go to Home
        </Link>
      </button>
    </div>
  );
};

const styles = {
  container: {
    textAlign: "center",
    padding: "20px",
    backgroundColor: "#f4f4f4",
    minHeight: "100vh",
  },
  title: { fontSize: "24px", marginBottom: "20px", fontWeight: "bold" },
  cameraGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
    justifyContent: "center",
  },
  cameraBox: {
    padding: "20px",
    textAlign: "center",
    backgroundColor: "#fff",
    boxShadow: "0 0 10px rgba(0,0,0,0.2)",
    borderRadius: "10px",
  },
  statusLight: {
    width: "25px",
    height: "25px",
    borderRadius: "50%",
    margin: "0 auto 10px",
  },
  cameraText: { fontSize: "18px", fontWeight: "bold" },
  video: {
    width: "100%",
    maxWidth: "400px",
    height: "auto",
    borderRadius: "10px",
    marginTop: "10px",
  },
  offlineText: {
    color: "red",
    fontSize: "14px",
    fontStyle: "italic",
    marginTop: "10px",
  },
  alertBox: {
    marginTop: "20px",
    padding: "10px",
    backgroundColor: "#ffebeb",
    border: "1px solid red",
    borderRadius: "10px",
  },
  button: {
    marginTop: "30px",
    padding: "10px 20px",
    width: "50%",
    borderRadius: "10px",
    backgroundColor: "#0077b6",
    border: "none",
    cursor: "pointer",
    color: "white",
  },
  link: { color: "white", textDecoration: "none" },
};

export default CameraStatus;
