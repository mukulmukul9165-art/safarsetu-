/**
 * Geocoding + routing: OpenRouteService (free API key) when ORS_API_KEY is set;
 * otherwise Nominatim + straight-line Haversine (no key).
 */

const ORS_BASE = 'https://api.openrouteservice.org';

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function geocodeNominatim(text) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'LocalCabsBackend/1.0 (contact@localhost)' },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.length) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), label: data[0].display_name };
}

async function geocodeORS(text, apiKey) {
  const url = `${ORS_BASE}/geocode/search?text=${encodeURIComponent(text)}&size=1`;
  const res = await fetch(url, { headers: { Authorization: apiKey } });
  if (!res.ok) return null;
  const data = await res.json();
  const f = data?.features?.[0];
  if (!f?.geometry?.coordinates) return null;
  const [lng, lat] = f.geometry.coordinates;
  return { lat, lng, label: f.properties?.label || text };
}

async function directionsORS(lat1, lng1, lat2, lng2, apiKey) {
  const res = await fetch(`${ORS_BASE}/v2/directions/driving-car/geojson`, {
    method: 'POST',
    headers: {
      Authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      coordinates: [
        [lng1, lat1],
        [lng2, lat2],
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const feat = data?.features?.[0];
  if (!feat?.geometry?.coordinates) return null;
  const coords = feat.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  const meters = feat.properties?.summary?.distance ?? haversineKm(lat1, lng1, lat2, lng2) * 1000;
  const durationMin = (feat.properties?.summary?.duration ?? 0) / 60;
  return { coordinates: coords, distanceKm: meters / 1000, durationMin };
}

export async function resolveRoute(pickupText, dropText) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY || '';

  let pickup;
  let drop;

  if (apiKey) {
    pickup = await geocodeORS(pickupText, apiKey);
    drop = await geocodeORS(dropText, apiKey);
  }
  if (!pickup) pickup = await geocodeNominatim(pickupText);
  if (!drop) drop = await geocodeNominatim(dropText);

  if (!pickup || !drop) {
    const err = new Error('Could not find pickup or drop location. Try clearer addresses.');
    err.status = 400;
    throw err;
  }

  let coordinates = [
    [pickup.lat, pickup.lng],
    [drop.lat, drop.lng],
  ];
  let distanceKm = haversineKm(pickup.lat, pickup.lng, drop.lat, drop.lng);
  let durationMin = (distanceKm / 30) * 60;

  if (apiKey) {
    const routed = await directionsORS(pickup.lat, pickup.lng, drop.lat, drop.lng, apiKey);
    if (routed) {
      coordinates = routed.coordinates;
      distanceKm = routed.distanceKm;
      durationMin = routed.durationMin;
    }
  }

  return {
    pickup: { lat: pickup.lat, lng: pickup.lng, label: pickup.label },
    drop: { lat: drop.lat, lng: drop.lng, label: drop.label },
    coordinates,
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMin: Math.round(durationMin),
  };
}
