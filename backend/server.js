import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import cropRoutes from './routes/cropRoutes.js';
import storageRoutes from './routes/storageRoutes.js';
import emergencyRoutes from './routes/emergencyRoutes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Socket.IO configuration
const io = new Server(server, {
  cors: {
    origin: "*", // Allow any frontend client origin for local dev
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Store io in global scope for controllers to trigger events
global.io = io;

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/emergency', emergencyRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).send('AgriLink Climate-Smart Supply Chain Server running.');
});

// Socket.IO event handler
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // User joins their specific role/userID channel for tailored alerts
  socket.on('join', (data) => {
    if (data.userId) {
      socket.join(data.userId);
      console.log(`User ${data.userId} joined private room`);
    }
    if (data.role) {
      socket.join(data.role);
      console.log(`User socket joined role room: ${data.role}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`AgriLink Server running on port ${PORT}`);
  });
});
