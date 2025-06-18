import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./DeviceStatus.css";

const MAX_DEVICES = 10;

const DeviceStatus = () => {
  const [devices, setDevices] = useState([]);
  const [tempDevice, setTempDevice] = useState({ name: "", ip: "" });
  const [menuIndex, setMenuIndex] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const devicesRef = useRef([]);

  useEffect(() => {
    const storedDevices = localStorage.getItem("devices");
    if (storedDevices) {
      const parsed = JSON.parse(storedDevices);
      const initialized = parsed.map((device) => ({
        ...device,
        status: device.status || "checking...",
      }));
      setDevices(initialized);
      devicesRef.current = initialized;

      initialized.forEach((device) => checkDeviceStatus(device.id, device.ip));
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    devicesRef.current = devices;
    if (isInitialized) {
      localStorage.setItem("devices", JSON.stringify(devices));
    }
  }, [devices, isInitialized]);

  useEffect(() => {
    if (devices.length === 0) return;
    const interval = setInterval(() => {
      devicesRef.current.forEach((device) => {
        checkDeviceStatus(device.id, device.ip);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [devices.length]);

  const checkDeviceStatus = async (id, ip) => {
    try {
      const res = await axios.get(`http://localhost:8081/api/status?ip=${ip}`);
      const updated = {
        status: res.data.status || "unknown",
        gpioData: ip === "192.168.1.177" ? res.data.gpioData || [] : [],
      };
      updateDevice(id, updated);
    } catch (err) {
      console.error(`Failed to fetch device ${ip}:`, err);
      updateDevice(id, {
        status: "offline",
        gpioData: [],
      });
    }
  };

  const updateDevice = (id, updates) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === id ? { ...device, ...updates } : device
      )
    );
  };

  const handleAddInputs = () => {
    const { name, ip } = tempDevice;

    if (!name || !ip) return alert("Please enter both name and IP");

    const isValidIp = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/.test(ip);
    if (!isValidIp) return alert("Invalid IP address format");

    if (devicesRef.current.length >= MAX_DEVICES) {
      return alert(`You can only add up to ${MAX_DEVICES} devices.`);
    }

    const isDuplicate = devicesRef.current.some((device) => device.ip === ip);
    if (isDuplicate) return alert("This IP is already added");

    const newDevice = {
      id: Date.now(),
      name,
      ip,
      status: "checking...",
      gpioData: [],
    };

    const updatedDevices = [...devicesRef.current, newDevice];
    setDevices(updatedDevices);
    setTempDevice({ name: "", ip: "" });
    checkDeviceStatus(newDevice.id, newDevice.ip);
  };

  const handleDelete = (index) => {
    const updated = devices.filter((_, i) => i !== index);
    setDevices(updated);
    setMenuIndex(null);
  };

  const handleEdit = (index) => {
    const device = devices[index];
    setTempDevice({ name: device.name, ip: device.ip });
    handleDelete(index);
  };

  return (
    <div className="device-status-container">
      <h2>Command & Control</h2>

      {!isInitialized ? (
        <p>Loading devices...</p>
      ) : (
        <>
          <div className="input-section">
            <input
              type="text"
              placeholder="Device Name"
              value={tempDevice.name}
              onChange={(e) =>
                setTempDevice({ ...tempDevice, name: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="IP Address"
              value={tempDevice.ip}
              onChange={(e) =>
                setTempDevice({ ...tempDevice, ip: e.target.value })
              }
            />
            <button
              onClick={handleAddInputs}
              disabled={devices.length >= MAX_DEVICES}
            >
              Add Device
            </button>
            {devices.length >= MAX_DEVICES && (
              <p className="warning-text">Maximum of 10 devices allowed.</p>
            )}
          </div>

          <div className="devices-list">
            {devices.map((device, index) => (
              <div key={device.id} className="device-row">
                <div className="device-info-line">
                  <div className={`status-bar ${device.status}`}></div>
                  <span className="device-name">
                    {device.name} ({device.ip})
                  </span>
                  <span className="device-status">{device.status}</span>

                  <div className="menu-wrapper">
                    <span
                      className="dots"
                      onClick={() =>
                        setMenuIndex(menuIndex === index ? null : index)
                      }
                    >
                      ⋮
                    </span>
                    {menuIndex === index && (
                      <div className="menu">
                        <div onClick={() => handleEdit(index)}>Edit</div>
                        <div onClick={() => handleDelete(index)}>Delete</div>
                      </div>
                    )}
                  </div>
                </div>

                {device.ip === "192.168.1.177" && device.gpioData.length > 0 && (
                  <div className="gpio-info">
                    {device.gpioData.map((gpio, i) => (
                      <div key={i} className="gpio-row">
                        Zone {gpio.pin}:{" "}
                        <strong
                          className={gpio.status === "Alarm" ? "alarm" : "no-alarm"}
                        >
                          {gpio.status}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DeviceStatus;
