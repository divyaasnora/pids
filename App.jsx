import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Signup from "./pages/Signup/Signup";
import Login from "./pages/Login/Login";
import Home from "./pages/Home/Home";
import "./App.css";
import About from "./pages/About/About";
import Navbar from "./Components/Navbar/Navbar";
import CameraStatus from "./Components/CameraStatus/CameraStatus";
import DeviceStatus from "./Components/DeviceStatus/DeviceStatus";
import AdminPage from "./pages/Admin/AdminPage";
import Map from "./Components/Map/MapFeature";


function AppWrapper() {
  const location = useLocation();
  const hideNavbarRoutes = ["/login", "/signup"];
  const hideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/about" element={<About />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/camera" element={<CameraStatus />} />
        <Route path="/status" element={<DeviceStatus />} />
        <Route path="/admin-panel" element={<AdminPage />} />
        <Route path="/map" element={<Map />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppWrapper />
    </Router>
  );
}

export default App;
