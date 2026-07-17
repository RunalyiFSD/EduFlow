const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorHandler');
const { CLIENT_ORIGIN } = require('./config/env');

const app = express();

const allowedOrigins = [];
if (CLIENT_ORIGIN) {
  allowedOrigins.push(...CLIENT_ORIGIN.split(',').map(o => o.trim().replace(/\/$/, '')));
}
allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const normalizedOrigin = origin.replace(/\/$/, '');
    const isAllowed = allowedOrigins.includes(normalizedOrigin) || 
                      /^https?:\/\/localhost(:\d+)?$/.test(normalizedOrigin) ||
                      process.env.NODE_ENV === 'development';
                      
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Serve uploaded course cover images
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'eduflow-backend' });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);

// 404 fallback for unmatched API routes
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

module.exports = app;
