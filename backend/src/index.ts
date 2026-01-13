import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './routes';
import { logActivityMiddleware } from './middleware/activityLog';
import { apiLimiter } from './middleware/rateLimiter';
import { initializeFirebase } from './utils/firebase';

dotenv.config();

// Initialize Firebase Admin SDK for phone auth
try {
  initializeFirebase();
} catch (error) {
  console.warn('⚠️ Firebase initialization failed. Phone auth will not work.');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security: Helmet for HTTP security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disable CSP for API server (frontend handles this)
}));

// Security: Rate limiting to prevent brute-force attacks
app.use(apiLimiter);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    process.env.FRONTEND_URL || '',
    // Production URLs
    'https://cafirm.vercel.app',
    'https://cafirmpro.vercel.app',
    'https://www.cafirmpro.in',
    'https://cafirmpro.in',
    /\.vercel\.app$/,  // Allow all Vercel preview deployments
  ].filter(Boolean),
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Activity logging middleware (after auth)
app.use(logActivityMiddleware);

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

