import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiRouter } from '../src/server/routes.ts';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount all API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    platform: 'vercel-serverless',
    timestamp: new Date().toISOString(),
  });
});

export default app;
