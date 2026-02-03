import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import substanceRoutes from './routes/substances.js';
import inventoryRoutes from './routes/inventory.js';
import purchaseRoutes from './routes/purchase.js';
import consumeRoutes from './routes/consume.js';
import balanceRoutes from './routes/balance.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https://api.devnet.solana.com", "https://api.mainnet-beta.solana.com"],
    },
  },
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API Routes
app.use('/api/v1/substances', substanceRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/purchase', purchaseRoutes);
app.use('/api/v1/consume', consumeRoutes);
app.use('/api/v1/balance', balanceRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`💊 substance.fun backend running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API: http://localhost:${PORT}/api/v1`);
});

export default app;
