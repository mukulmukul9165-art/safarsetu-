import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import bookingsRoutes from './routes/bookings.routes.js';
import adminRoutes from './routes/admin.routes.js';
import superadminRoutes from './routes/superadmin.routes.js';
import mapsRoutes from './routes/maps.routes.js';
import catalogRoutes from './routes/catalog.routes.js';

const app = express();
const PORT = Number(process.env.PORT) || 4000;

const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins,
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/superadmin', superadminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal error' });
});

app.listen(PORT, () => {
  console.log(`API http://localhost:${PORT}`);
});
