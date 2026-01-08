// s2s_auth_backend/index.js
require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');
const compression = require('compression'); // 🚀 FAST LOADING

// Middlewares
app.use(compression()); // Response size chhota karega
app.use(express.json());
app.use(cors());

// Routes Setup
const authRoutes = require('./routes/auth');
const webRoutes = require('./routes/web/');
const appRoutes = require('./routes/app');

// Mounting Routes
app.use('/api/auth', authRoutes); // Common Auth
app.use('/api/web', webRoutes); // Web Specific
app.use('/api/app', appRoutes);

const PORT = process.env.PORT || 4001;
app.listen(PORT,'0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

