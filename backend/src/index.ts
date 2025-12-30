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
    process.env.CORS_ORIGIN || '',
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Activity logging middleware (after auth)
app.use(logActivity);

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

