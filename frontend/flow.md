Yeh raha concise summary — backend backend/ folder me Node + Express + Prisma + MySQL setup hai, frontend ab src/lib/api.js se API call karta hai, mockData.js hata diya, vite.config.js me /api → http://localhost:4000 proxy hai, maps ke liye POST /api/maps/route backend par OpenRouteService key (optional) + fallback Nominatim + straight line use hota hai.

Backend layout
backend/package.json — scripts: dev, db:push, db:seed, etc.
backend/prisma/schema.prisma — User, DriverProfile, CarCategory, Booking, Payment
backend/prisma/seed.mjs — demo users + cars + sample booking/payments
backend/src/index.js — Express + CORS
backend/src/routes/ — auth, bookings, admin, superadmin, maps, catalog
backend/src/services/map.service.js — ORS + Nominatim fallback
backend/.env.example — DATABASE_URL, JWT_SECRET, OPENROUTESERVICE_API_KEY, PORT, CORS_ORIGIN
Chalane ka order (MySQL + Prisma)
MySQL me DB banao, phir backend/.env me DATABASE_URL copy karo (.env.example se).
cd backend → npm install → npx prisma db push → npm run db:seed
ORS key (optional, better routing): openrouteservice.org se free key → OPENROUTESERVICE_API_KEY in .env. Bina key ke bhi Nominatim + Haversine se route/distance chalega.
npm run dev (backend port 4000).
Root se npm run dev (Vite 5173 — proxy /api backend ko bhejega).
Frontend changes (flow same, data real)
App.jsx: login ab sirf server se aaya token store karta hai.
AuthModal.jsx: /api/auth/login + /api/auth/register.
BookingPage.jsx: cars /api/catalog/cars, bookings /api/bookings, route /api/maps/route, create POST /api/bookings; user prop se naam.
AdminDashboard.jsx: saari lists + mutations admin APIs se.
SuperadminDashboard.jsx: /api/superadmin/admins + PATCH (password optional).
DriverDashboard.jsx: bookings API, accept PATCH ... action: accept; broken JSX comment fix; RouteMap ko routeCoords / distanceKm pass.
RouteMap.jsx: props se polyline + distance.
Cars.jsx: /api/catalog/cars (public, login ki zaroorat nahi).
Demo logins (seed ke baad)
Superadmin: 0000000000 / superadmin
Admin: 9999999999 / admin
Customer: 7777777777 / user
Driver (approved): 8888888888 / driver
Production me frontend ko alag domain par host karoge to VITE_API_URL set karo (full backend URL) aur backend CORS_ORIGIN me woh origin add karo.

Agar chaho to agla step: MySQL connection error ya ORS 401 ka exact error paste karna — us hisaab se map.service / env tune kar denge.