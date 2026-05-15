import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
import { authMiddleware } from '../auth.js';
import { bookingToJson, STATUS_FROM_UI } from '../formatters.js';
import { resolveRoute } from '../services/map.service.js';

const router = Router();

const includeBooking = {
  customer: true,
  driver: { include: { driverProfile: true } },
};

async function ensureRoute(body) {
  let {
    pickupLat,
    pickupLng,
    dropLat,
    dropLng,
    routeCoords,
    distanceKm,
    pickup,
    drop,
  } = body;

  if (
    pickupLat != null &&
    pickupLng != null &&
    dropLat != null &&
    dropLng != null &&
    routeCoords?.length >= 2 &&
    distanceKm != null
  ) {
    return {
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      routeGeoJson: JSON.stringify(routeCoords),
      distanceKm: Number(distanceKm),
    };
  }

  const route = await resolveRoute(String(pickup).trim(), String(drop).trim());
  return {
    pickupLat: route.pickup.lat,
    pickupLng: route.pickup.lng,
    dropLat: route.drop.lat,
    dropLng: route.drop.lng,
    routeGeoJson: JSON.stringify(route.coordinates),
    distanceKm: route.distanceKm,
  };
}

router.get('/', authMiddleware(['CUSTOMER', 'DRIVER', 'ADMIN']), async (req, res) => {
  try {
    const { role, sub } = req.auth;
    let where = {};
    if (role === 'CUSTOMER') where = { customerId: sub };
    else if (role === 'DRIVER') where = { driverId: sub };
    else if (role === 'ADMIN') where = {};
    const list = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: includeBooking,
    });
    return res.json(list.map(bookingToJson));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authMiddleware(['CUSTOMER']), async (req, res) => {
  try {
    const { pickup, drop, bookingDate, bookingTime, carName, fare } = req.body;
    if (!pickup || !drop || !bookingDate || !bookingTime || !carName) {
      return res.status(400).json({ message: 'Missing booking fields' });
    }

    const route = await ensureRoute({ ...req.body, pickup, drop });
    const fareNum = fare != null ? Number(fare) : route.distanceKm * 12;

    const booking = await prisma.booking.create({
      data: {
        customerId: req.auth.sub,
        pickupText: pickup,
        dropText: drop,
        bookingDate,
        bookingTime,
        carName,
        fare: Math.round(fareNum),
        status: 'PENDING',
        ...route,
      },
      include: includeBooking,
    });
    return res.status(201).json(bookingToJson(booking));
  } catch (e) {
    console.error(e);
    const status = e.status || 500;
    return res.status(status).json({ message: e.message || 'Server error' });
  }
});

router.post('/admin', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const { customer, phone, pickup, drop, car, date, time, fare } = req.body;
    if (!customer || !phone || !pickup || !drop || !date || !time || !car) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    let cust = await prisma.user.findFirst({
      where: { phone: String(phone), role: 'CUSTOMER', deleted: false },
    });
    if (!cust) {
      const passwordHash = await bcrypt.hash('changeme123', 10);
      cust = await prisma.user.create({
        data: {
          phone: String(phone),
          name: customer,
          passwordHash,
          role: 'CUSTOMER',
          location: pickup,
        },
      });
    }

    const route = await ensureRoute({ pickup, drop });
    const fareNum = fare != null ? Number(fare) : Math.round(route.distanceKm * 12);

    const booking = await prisma.booking.create({
      data: {
        customerId: cust.id,
        pickupText: pickup,
        dropText: drop,
        bookingDate: date,
        bookingTime: time,
        carName: car,
        fare: fareNum,
        status: 'PENDING',
        ...route,
      },
      include: includeBooking,
    });
    return res.status(201).json(bookingToJson(booking));
  } catch (e) {
    console.error(e);
    const status = e.status || 500;
    return res.status(status).json({ message: e.message || 'Server error' });
  }
});

router.patch('/:id', authMiddleware(['ADMIN', 'DRIVER']), async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id }, include: includeBooking });
    if (!booking) return res.status(404).json({ message: 'Not found' });

    if (req.auth.role === 'DRIVER') {
      if (booking.driverId !== req.auth.sub) return res.status(403).json({ message: 'Not your ride' });
      if (req.body.action === 'accept' && booking.status === 'ASSIGNED') {
        const updated = await prisma.booking.update({
          where: { id },
          data: { status: 'ACCEPTED' },
          include: includeBooking,
        });
        return res.json(bookingToJson(updated));
      }
      return res.status(400).json({ message: 'Invalid driver update' });
    }

    const data = {};
    if (req.body.pickup != null) data.pickupText = req.body.pickup;
    if (req.body.drop != null) data.dropText = req.body.drop;
    if (req.body.fare != null) data.fare = Number(req.body.fare);
    if (req.body.date != null) data.bookingDate = req.body.date;
    if (req.body.time != null) data.bookingTime = req.body.time;

    if (req.body.driverId) {
      data.driverId = req.body.driverId;
      data.status = 'ASSIGNED';
    }

    if (req.body.status && STATUS_FROM_UI[req.body.status]) {
      data.status = STATUS_FROM_UI[req.body.status];
    }

    if (req.body.pickup && req.body.drop && (req.body.pickup !== booking.pickupText || req.body.drop !== booking.dropText)) {
      const route = await ensureRoute({ pickup: req.body.pickup, drop: req.body.drop });
      Object.assign(data, route);
    }

    const updated = await prisma.booking.update({
      where: { id },
      data,
      include: includeBooking,
    });
    return res.json(bookingToJson(updated));
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e.message || 'Server error' });
  }
});

router.delete('/:id', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    await prisma.booking.delete({ where: { id: req.params.id } });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ message: 'Delete failed' });
  }
});

export default router;
