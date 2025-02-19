const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const WebSocket = require('ws');
const { setupWSConnection } = require('y-websocket/bin/utils');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

const corsOptions = {
  origin: [
    'https://mapora.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'https://mapora.vercel.app',
      'http://localhost:3000'
    ],
    methods: ['GET', 'POST'],
  }
});
app.locals.io = io;

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinCanvas', (canvasId) => {
    socket.join(canvasId);
    console.log(`Client joined canvas room ${canvasId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});
const wss = new WebSocket.Server({ server, path: '/yjs' });
wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req, { gc: true });
});

const thinkTreeRoutes = require('./routes/thinkTree');
app.use('/api/thinking-trees', thinkTreeRoutes);
const usersRoutes = require('./routes/users');
app.use('/api/users', usersRoutes);
const canvasRoutes = require('./routes/canvas');
app.use('/api/canvas', canvasRoutes);
const invitationsRouter = require('./routes/invitations');
app.use('/api/invitations', invitationsRouter);
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
});
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is working' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  if (err instanceof cors.CorsError) {
    res.status(403).json({ message: err.message });
  } else if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    process.exit(1);
  } else {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});