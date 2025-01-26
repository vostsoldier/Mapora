const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 5001; 
require('dotenv').config();
const allowedOrigins = [
  'https://think-tree-git-main-vostsoldiers-projects.vercel.app', 
  'http://localhost:3000', 
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
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