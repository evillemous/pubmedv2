import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import pool from './config/database';
import settingsRoutes from './routes/settingsRoutes';
import researchRoutes from './routes/researchRoutes';
import literatureRoutes from './routes/literatureRoutes';
import manuscriptRoutes from './routes/manuscriptRoutes';

dotenv.config();

console.log('Initializing Express application...');
const app = express();
const port = process.env.PORT || 8000;

console.log('Setting up middleware...');
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

console.log('Testing database connection...');
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.stack);
  } else {
    console.log('Database connection successful:', res.rows[0]);
  }
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

console.log('Setting up routes...');
app.use('/api/settings', settingsRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/literature', literatureRoutes);
app.use('/api/manuscript', manuscriptRoutes);

app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok', 
    timestamp: new Date(),
    version: '1.0.0'
  });
});

app.use((req, res) => {
  console.log(`Route not found: ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('Express application initialized');

export default app;
