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
const internalCronRoutes = require("./routes/internal/cron");
const wishlistRoutes = require("./routes/web/wishlist");



// Mounting Routes
app.use('/api/auth', authRoutes); // Common Auth
app.use('/api/web', webRoutes); // Web Specific
app.use('/api/app', appRoutes);
app.use("/internal/cron", internalCronRoutes);
app.use("/api/wishlist", wishlistRoutes);



const PORT = process.env.PORT || 4001;
app.listen(PORT,'0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});




