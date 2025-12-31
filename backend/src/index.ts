import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { logActivity } from './middleware/activityLog';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    process.env.FRONTEND_URL || '',
    // Production URLs (add your Vercel domain)
    'https://cafirmpro.vercel.app',
    /\.vercel\.app$/,  // Allow all Vercel preview deployments
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Activity logging middleware (after auth)
app.use(logActivity);

// Routes
app.use('/api', routes);

// Health check (both paths for different hosting platforms)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

