const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const ping = require("ping");
const { Server } = require("socket.io");
const http = require("http");
require("dotenv").config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", methods: ["GET", "POST"], credentials: true },
});
app.use(cors({ origin: "http://localhost:5173", methods: ["GET", "POST"], credentials: true }));
app.use(express.json());
const dbSignup = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root@123",
  database: "signup",
});

const dbAlerts = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root@123",
  database: "dataa",
});

dbSignup.connect(err => {
  if (err) return console.error("Signup DB Connection Failed:", err);
  console.log("Connected to Signup Database");
});

dbAlerts.connect(err => {
  if (err) return console.error("Alerts DB Connection Failed:", err);
  console.log("Connected to Alerts Database");
});
let latestESPData = {};
app.post("/api/esp32-data", (req, res) => {
  const { Zone, status } = req.body;
  if (Zone === undefined || !status) {
    return res.status(400).json({ message: "Missing pin or status" });
  }
  const data = {
    Zone,
    status,
    time: new Date().toISOString(),
  };
  latestESPData[Zone] = status;
  console.log("ESP32 Data:", data);
  io.emit("esp32-data", data);
  res.status(200).json({ message: "Data received" });
});
app.get("/api/status", async (req, res) => {
  const ip = req.query.ip;
  if (!ip) return res.status(400).json({ status: "invalid-ip" });
  try {
    const result = await ping.promise.probe(ip, { timeout: 2 });

    const gpioData = Object.entries(latestESPData).map(([pin, status]) => ({
      pin: Number(pin),
      status,
    }));

    res.json({
      status: result.alive ? "online" : "offline",
      gpioData,
    });
  } catch {
    res.status(500).json({ status: "offline", gpioData: [] });
  }
});
let cameraStatus = {
  camera1: false,
  camera2: true,
  camera3: false,
  camera4: false,
};
app.get("/api/camera-status", (req, res) => {
  res.json(cameraStatus);
  console.log(cameraStatus);
});
setInterval(() => {
  cameraStatus = {
    camera1: Math.random() > 0.5,
    camera2: Math.random() > 0.5,
    camera3: Math.random() > 0.5,
    camera4: Math.random() > 0.5,
  };
  io.emit("camera-update", cameraStatus);
}, 5000);
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    dbSignup.query("SELECT COUNT(*) AS count FROM login", (err, results) => {
      if (err) return res.status(500).json({ message: "Error checking user count", error: err });

      const userCount = results[0].count;
      const isAdmin = userCount === 0;
      const isApproved = userCount === 0;

      const sql = "INSERT INTO login (name, email, password, role, approved) VALUES (?, ?, ?, ?, ?)";
      dbSignup.query(sql, [name, email, hashedPassword, isAdmin, isApproved], err => {
        if (err) return res.status(500).json({ message: "Database error", error: err });

        res.status(201).json({ message: isAdmin? "Admin registered!" : "User registered! Waiting for approval." });
      });
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong!", error });
  }
});
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ status: "error", message: "Email and password are required!" });

  const sql = "SELECT * FROM login WHERE email = ?";
  dbSignup.query(sql, [email], (err, data) => {
    if (err) return res.status(500).json({ status: "error", message: "Database error", error: err });
    if (data.length === 0) return res.status(404).json({ status: "error", message: "User not found!" });

    const user = data[0];
    bcrypt.compare(password, user.password)
      .then(isMatch => {
        if (!isMatch) return res.status(401).json({ status: "error", message: "Invalid credentials!" });

        if (user.approved === 0) {
          io.emit("approval-request", { id: user.id, name: user.name, email: user.email });
          return res.status(403).json({ status: "error", message: "Your account is not yet approved by admin." });
        }

        res.status(200).json({
          status: "success",
          message: "Login Successfull!",
          role: user.role ? "admin" : "user",
        });
      })
      .catch(err => res.status(500).json({ status: "error", message: "Something went wrong!", error: err }));
  });
});

app.post("/approve-user", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ status: "error", message: "User ID is required!" });

  const sql = "UPDATE login SET approved = 1 WHERE id = ?";
  dbSignup.query(sql, [userId], err => {
    if (err) return res.status(500).json({ status: "error", message: "Database error", error: err });
    res.status(200).json({ status: "success", message: "User approved successfully!" });
  });
});
app.get("/pending-users", (req, res) => {
  dbSignup.query("SELECT id, name, email FROM login WHERE approved = 0", (err, results) => {
    if (err) return res.status(500).json({ message: "Error fetching users", error: err });
    res.json(results);
  });
});
server.listen(8081, () => console.log(" Server running on port 8081"));



















































































































