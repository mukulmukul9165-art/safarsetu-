import { Router } from 'express';
import { resolveRoute } from '../services/map.service.js';

const router = Router();

router.post('/route', async (req, res) => {
  try {
    const { pickup, drop } = req.body;
    if (!pickup || !drop) return res.status(400).json({ message: 'pickup and drop required' });
    const route = await resolveRoute(String(pickup).trim(), String(drop).trim());
    return res.json(route);
  } catch (e) {
    const status = e.status || 500;
    return res.status(status).json({ message: e.message || 'Map error' });
  }
});

export default router;
