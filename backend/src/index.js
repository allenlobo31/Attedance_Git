import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import attendanceRoutes from './routes/attendanceRoutes.js';

const app = express();
const frontendDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');

// Only trust X-Forwarded-For when explicitly running behind a proxy,
// otherwise clients could spoof their IP and bypass the lock.
if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/attendance', attendanceRoutes);
app.use(express.static(frontendDist));
app.get('/', (_req, res) => res.sendFile(path.join(frontendDist, 'index.html')));

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
