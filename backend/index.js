const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 5001; 
require('dotenv').config();
const corsOptions = {
  origin: function (origin, callback) {
    console.log(`Incoming request origin: ${origin}`);
    if (!origin) return callback(null, true); 
    const vercelPattern = /^https:\/\/.*\.vercel\.app$/;
    const isDemo = process.env.DEMO_MODE === 'true';

    if (isDemo) {
      return callback(null, true);
    }

    if (vercelPattern.test(origin)) {
      return callback(null, true);
    }

    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true, 
  optionsSuccessStatus: 200, 
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
const thinkTreeRoutes = require('./routes/thinkTree');
app.use('/api/thinking-trees', thinkTreeRoutes);
const usersRoutes = require('./routes/users');
app.use('/api/users', usersRoutes);
app.get('/', (req, res) => {
  res.send('Hello from the backend!');
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
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});