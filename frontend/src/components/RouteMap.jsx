import React, { useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createCustomIcon = (color) =>
  L.divIcon({
    html: `<div style="background-color: ${color}; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 15px ${color}80; transform: scale(1.1);"></div>`,
    className: 'custom-map-marker',
    iconSize: [15, 15],
    iconAnchor: [7.5, 7.5],
  });

const pickupIcon = createCustomIcon('#22c55e');
const dropIcon = createCustomIcon('#ef4444');

const RouteMap = ({
  pickup,
  drop,
  routeCoords = null,
  distanceKm = null,
}) => {
  const { t } = useTranslation();
  const positions = useMemo(() => {
    if (routeCoords?.length >= 2) return routeCoords;
    return [
      [28.6139, 77.209],
      [28.6353, 77.2245],
    ];
  }, [routeCoords]);

  const pickupCoords = positions[0];
  const dropCoords = positions[positions.length - 1];
  const center = useMemo(() => {
    const midLat = (pickupCoords[0] + dropCoords[0]) / 2;
    const midLng = (pickupCoords[1] + dropCoords[1]) / 2;
    return [midLat, midLng];
  }, [pickupCoords, dropCoords]);

  const displayKm =
    distanceKm != null && !Number.isNaN(Number(distanceKm))
      ? Number(distanceKm).toFixed(1)
      : '—';

  const ChangeViewAndBounds = () => {
    const map = useMap();
    useEffect(() => {
      if (positions && positions.length >= 2) {
        const bounds = L.latLngBounds(positions);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }, [map]);
    return null;
  };

  return (
    <div className="w-full h-full min-h-[260px] rounded-2xl overflow-hidden relative border border-border shadow-2xl">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        zoomControl={true}
        style={{ height: '100%', width: '100%', minHeight: '260px' }}
      >
        <ChangeViewAndBounds />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <Marker position={pickupCoords} icon={pickupIcon}>
          <Popup>
            <div className="font-bold text-sm">{t('driver.map_pickup_popup', { location: pickup })}</div>
          </Popup>
        </Marker>

        <Marker position={dropCoords} icon={dropIcon}>
          <Popup>
            <div className="font-bold text-sm">{t('driver.map_drop_popup', { location: drop })}</div>
          </Popup>
        </Marker>

        {/* Bottom Thick Glow Shadow Line */}
        <Polyline 
          positions={positions} 
          color="#1557B0" 
          weight={8} 
          opacity={0.3} 
        />
        {/* Top Premium Google Maps Blue Route Line */}
        <Polyline 
          positions={positions} 
          color="#1A73E8" 
          weight={5} 
          opacity={0.95} 
        />
      </MapContainer>

      <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-[1000] p-2.5 sm:p-4 glass-card border-primary/30 pointer-events-none">
        <p className="text-[9px] sm:text-[10px] text-primary uppercase font-black mb-0.5">{t('driver.map_total_distance')}</p>
        <p className="text-lg sm:text-2xl font-black text-dark italic">
          {displayKm}{' '}
          <span className="text-[9px] sm:text-xs text-muted not-italic uppercase font-bold">{t('driver.unit_km')}</span>
        </p>
      </div>

      <div className="absolute bottom-3 right-3 sm:bottom-6 sm:right-6 z-[1000] flex gap-1.5 sm:gap-2 pointer-events-none">
        <div className="glass-card px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 border-border">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[8px] sm:text-[9px] font-black uppercase text-dark tracking-widest">{t('driver.map_pickup')}</span>
        </div>
        <div className="glass-card px-2.5 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 border-border">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full" />
          <span className="text-[8px] sm:text-[9px] font-black uppercase text-dark tracking-widest">{t('driver.map_drop')}</span>
        </div>
      </div>
    </div>
  );
};

export default RouteMap;
