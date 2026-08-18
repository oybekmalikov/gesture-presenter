import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import apiRouter from './routes/api.routes.js';
import { FileService } from './services/file.service.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5050', 10);
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-root-password'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
FileService.init().catch((err) => {
  console.error('[Server] Failed to initialize storage:', err);
});
const pdfDir = path.resolve(process.env.STORAGE_PDF_DIR || './public/pdf');
const glbDir = path.resolve(process.env.STORAGE_GLB_DIR || './public/glb');
app.use('/files/pdf', express.static(pdfDir));
app.use('/files/glb', express.static(glbDir));
app.use('/models', express.static(glbDir));
app.use('/api', apiRouter);
app.get('/', (_req, res) => {
  res.json({
    name: 'OKMK AI Presentation Platform',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      files: '/api/files',
      upload: '/api/upload',
      health: '/api/health',
    },
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Project running on: http://localhost:${PORT}`);
});
