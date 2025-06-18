import { Link } from "react-router-dom";
import "./Navbar.css";
import Company from "../../assets/download.jpg"
import gmail from "../../assets/icons8-gmail-48.png"
import icon from "../../assets/ICON.png"
import { useState,useEffect } from "react";
import { io } from "socket.io-client";


const socket = io("http://localhost:8081");
const Navbar = () => {
  const [hasNewRequests, setHasNewRequests] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingUsers, setPendingUsers] = useState([]);

  useEffect(() => {
   
    socket.on("approval-requests", (user) => {
      console.log("New approval request:", user);
      setHasNewRequests((prev) => prev + 1); 
    });

    return () => socket.disconnect();
  }, []);

  const handleClickNotification = async () => {
    setShowNotifications(!showNotifications);
    setHasNewRequests(false);

    try {
      const res = await fetch("http://localhost:8081/pending-users");
      const data = await res.json();
      setPendingUsers(data);
    } catch (err) {
      console.error("Error fetching pending users:", err);
    }
  };

  const approveUser = async (id) => {
    try {
      const res = await fetch("http://localhost:8081/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      const data = await res.json();
      if (data.status === "success") {
        setPendingUsers((prev) => prev.filter((u) => u.id !== id));
      }
    } catch (err) {
      console.error("Error approving user:", err);
    }
  };

  return (
    <>
      <div className="firstnavbar">
        <nav className="nav-logo">
          <img src={gmail} alt="Gmail" />
          <span>info@Varisis.in</span>
          
        
          <div style={{ position: "relative" }}>
            <img
              src={icon}
              alt="notification"
              onClick={handleClickNotification}
              style={{ cursor: "pointer" }}
            />
            {hasNewRequests > 0 && <span className="notification-dot" />}
            {showNotifications && (
              <div className="notification-dropdown">
                {pendingUsers.length === 0 ? (
                  <p>No pending requests.</p>
                ) : (
                  pendingUsers.map((user) => (
                    <div key={user.id} className="notification-item">
                      <p>{user.name} ({user.email})</p>
                      <button onClick={() => approveUser(user.id)}>Approve</button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="navbar">
        <nav className="nav-logo">
          <img src={Company} alt="Company Logo" />
          Varisis
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/login">Login</Link></li>
            <li><Link to="/signup">Signup</Link></li>
          </ul> 
        </nav>
      </div>
    </>
  );
};

export default Navbar;