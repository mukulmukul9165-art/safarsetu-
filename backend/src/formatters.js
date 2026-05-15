const UI_STATUS = {
  PENDING: 'Pending',
  ASSIGNED: 'Assigned',
  ACCEPTED: 'Accepted',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function bookingToJson(b) {
  const driverProfile = b.driver?.driverProfile;
  return {
    id: b.id,
    customer: b.customer?.name || 'Customer',
    phone: b.customer?.phone || '',
    pickup: b.pickupText,
    drop: b.dropText,
    date: b.bookingDate,
    time: b.bookingTime,
    distance: `${Number(b.distanceKm).toFixed(1)} km`,
    fare: Math.round(b.fare),
    car: b.carName,
    status: UI_STATUS[b.status] || b.status,
    driverUserId: b.driverId || null,
    driver:
      b.driver && driverProfile
        ? {
            name: b.driver.name,
            vehicleName: driverProfile.carType,
            vehicleNumber: driverProfile.vehicleNumber,
          }
        : b.driver
          ? {
              name: b.driver.name,
              vehicleName: b.carName,
              vehicleNumber: '',
            }
          : null,
    routeCoords: b.routeGeoJson ? JSON.parse(b.routeGeoJson) : null,
    pickupLat: b.pickupLat,
    pickupLng: b.pickupLng,
    dropLat: b.dropLat,
    dropLng: b.dropLng,
  };
}

export const STATUS_FROM_UI = {
  Pending: 'PENDING',
  Assigned: 'ASSIGNED',
  Accepted: 'ACCEPTED',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
};
