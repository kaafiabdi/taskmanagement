const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const profileRoutes = require("./routes/profileRoutes");
const userRoutes = require("./routes/userRoutes");

app.use(express.json());
app.use(cors());

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

const mongoUrl = process.env.MONGODB_URL;
if (!mongoUrl) {
  console.error('MONGODB_URL is not defined. Set it in backend/.env or as an environment variable.');
  process.exit(1);
}

// Basic validation: ensure the connection string starts with a supported scheme
if (!/^mongodb(\+srv)?:\/\//i.test(mongoUrl)) {
  console.error('MONGODB_URL appears invalid. It must start with "mongodb://" or "mongodb+srv://".\nReplace the placeholder in backend/.env with a valid MongoDB connection string.');
  console.error('Example: mongodb+srv://user:password@cluster0.mongodb.net/mydb?retryWrites=true&w=majority');
  process.exit(1);
}

mongoose.connect(mongoUrl, err => {
  if (err) throw err;
  console.log("Mongodb connected...");
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/users", userRoutes);

// Health check endpoints
app.get('/health', (req, res) => {
  return res.status(200).json({ status: true, msg: 'OK', uptime: process.uptime(), timestamp: Date.now() });
});

app.get('/api/health', (req, res) => {
  return res.status(200).json({ status: true, msg: 'API OK', uptime: process.uptime(), timestamp: Date.now() });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.resolve(__dirname, "../frontend/build")));
  app.get("*", (req, res) => res.sendFile(path.resolve(__dirname, "../frontend/build/index.html")));
}

const port = process.env.PORT || 5000;
const server = app.listen(port, () => {
  console.log(`Backend is running on port ${port}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`\nError: Port ${port} is already in use.`);
    console.error('Please stop the process using that port or start the server on a different port.');
    console.error(`On Windows: run \`netstat -ano | findstr :${port}\` to find the PID, then \`taskkill /PID <PID> /F\`.\n`);
    process.exit(1);
  }
  // rethrow unexpected errors
  throw err;
});
