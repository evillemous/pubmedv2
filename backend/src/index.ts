import app from './app';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

const port = process.env.PORT || 8000;

console.log('Starting server...');
console.log('Environment variables:');
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`DB_HOST: ${process.env.DB_HOST}`);
console.log(`DB_PORT: ${process.env.DB_PORT}`);
console.log(`DB_NAME: ${process.env.DB_NAME}`);
console.log(`DB_USER: ${process.env.DB_USER}`);

const server = http.createServer(app);

server.on('error', (error) => {
  console.error('Server error:', error);
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
});

const keepAliveTimer = setInterval(() => {
  console.log('Server is still running...');
}, 10000); // Check every 10 seconds instead of 60 seconds

keepAliveTimer.unref();

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  clearInterval(keepAliveTimer);
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  clearInterval(keepAliveTimer);
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

console.log('Server initialization complete');
