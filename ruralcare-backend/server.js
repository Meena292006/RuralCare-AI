require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// (recommended) restrict CORS in dev
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*'}));
app.use(express.json());

// Import routes
const userRoutes = require('./routes/users');
app.use('/api/users', userRoutes);

// NEW: chat route
const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
