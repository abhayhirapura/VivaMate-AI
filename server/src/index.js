import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import vivaRoutes from './routes/vivaRoutes.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Student-Id'],
}));
app.use(express.json({ limit: '50kb' }));

// Health
app.get('/api/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';
  res.json({
    status:    'ok',
    db:        dbStatus,
    model:     process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/viva', vivaRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
});

// Error handler (no stack traces in response)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
});

async function start() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('⚠️ MongoDB connection failed (non‑fatal):', err.message);
    // Continue without DB – routes that need DB will handle missing connection.
  }

  app.listen(PORT, () => {
    console.log(`🚀 VivaMate server running on port ${PORT}`);
    console.log(`   Model: ${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}`);
    console.log(`   DB: ${process.env.MONGODB_URI?.split('@')[1] || 'unknown'}`);
  });
}

start();
