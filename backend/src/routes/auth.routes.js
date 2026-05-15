import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma.js';
import { signToken } from '../auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({ message: 'phone, password required' });
    }

    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || user.deleted) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const roleNorm = user.role;
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    if (roleNorm === 'DRIVER') {
      const p = await prisma.driverProfile.findUnique({ where: { userId: user.id } });
      if (!p || p.approvalStatus !== 'APPROVED') {
        return res.status(403).json({ message: 'Driver not approved yet' });
      }
    }

    const token = signToken(user);
    return res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role.toLowerCase(),
        name: user.name || user.phone,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const {
      phone,
      password,
      name,
      location,
      role,
      carType,
      vehicleNumber,
      vehiclePhotoUrl,
      licensePhotoUrl,
    } = req.body;

    if (!phone || !password || !name || !role) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const r = role.toUpperCase();
    if (r !== 'CUSTOMER' && r !== 'DRIVER') {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const exists = await prisma.user.findUnique({ where: { phone } });
    if (exists) return res.status(409).json({ message: 'Phone already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash,
        plainPassword: password,
        name,
        location: location || null,
        role: r,
        ...(r === 'DRIVER' && {
          driverProfile: {
            create: {
              carType: carType || 'Mini',
              vehicleNumber: vehicleNumber || 'NA',
              vehiclePhotoUrl: vehiclePhotoUrl || null,
              licensePhotoUrl: licensePhotoUrl || null,
              approvalStatus: 'PENDING',
            },
          },
        }),
      },
    });

    if (r === 'CUSTOMER') {
      const token = signToken(user);
      return res.json({
        token,
        user: { id: user.id, phone: user.phone, role: 'customer', name: user.name },
      });
    }

    const finalCarName = carType || 'Mini';
    const existingCar = await prisma.carCategory.findFirst({ where: { name: finalCarName } });
    if (!existingCar) {
      await prisma.carCategory.create({
        data: {
          name: finalCarName,
          type: 'Standard',
          pricePerKm: 12,
          seats: 4,
          image: vehiclePhotoUrl || 'https://placehold.co/200x100?text=New+Car',
        }
      });
    }

    return res.json({
      message: 'Registered. Admin will verify driver soon.',
      user: { id: user.id, phone: user.phone, role: 'driver', name: user.name },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
