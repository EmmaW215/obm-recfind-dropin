'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { FACILITY_TYPE_COLORS, CATEGORY_META } from '../lib/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function escapeHtml(s) {
  if (s == null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, '0')}${ampm}`;
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d + 'T12:00:00');
  return dt.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

function createFacilityIcon(facilityType, isSelected) {
  const color = FACILITY_TYPE_COLORS[facilityType] || '#6B7280';
  const size = isSelected ? 18 : 13;
  const border = isSelected ? '3px solid #1E3A5F' : '2.5px solid white';
  return L.divIcon({
    className: 'facility-marker',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:${border};border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.35);transition:all 0.2s;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
  });
}

function createActivityIcon(category, isSelected) {
  const meta = CATEGORY_META[category] || { color: '#6B7280' };
  const color = meta.color;
  const size = isSelected ? 14 : 10;
  const border = isSelected ? '3px solid #0f172a' : '2px solid white';
  return L.divIcon({
    className: 'activity-marker',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border:${border};border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

export default function MapView({
  facilities,
  userLocation,
  center,
  selectedFacility,
  onFacilityClick,
  activities,
  mapSyncing = false,
  /** When true, only facilities that appear in `activities` are drawn; when false, all nearby facilities. */
  hasActiveFilters = false,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const clusterRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

  const facilitiesForMap = useMemo(() => {
    const list = facilities || [];
    if (!hasActiveFilters) return list;
    const ids = new Set((activities || []).map((a) => a.facility_id).filter(Boolean));
    if (ids.size === 0) return [];
    return list.filter((f) => ids.has(f.id));
  }, [facilities, activities, hasActiveFilters]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    const c = center || userLocation || { lat: 43.4350, lng: -79.6800 };
    const map = L.map(mapRef.current, {
      center: [c.lat, c.lng],
      zoom: 12,
      zoomControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '\u00A9 <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    mapInstanceRef.current = map;
    setMapReady(true);
    return () => {
      if (clusterRef.current) {
        try {
          map.removeLayer(clusterRef.current);
        } catch (e) { /* ignore */ }
        clusterRef.current = null;
      }
      map.remove();
      mapInstanceRef.current = null;
      setMapReady(false);
    };
  }, []);

  // Facility markers + activity cluster (same filters as list via `activities` prop)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    Object.values(markersRef.current).forEach((m) => {
      try {
        m.remove();
      } catch (e) { /* ignore */ }
    });
    markersRef.current = {};

    if (clusterRef.current) {
      try {
        map.removeLayer(clusterRef.current);
      } catch (e) { /* ignore */ }
      clusterRef.current = null;
    }

    const bounds = L.latLngBounds([]);

    if (facilitiesForMap && facilitiesForMap.length > 0) {
      facilitiesForMap.forEach((f) => {
        if (typeof f.latitude !== 'number' || typeof f.longitude !== 'number') return;
        if (f.latitude < 40 || f.latitude > 50 || f.longitude < -85 || f.longitude > -75) return;

        const isSelected = selectedFacility === f.id;
        const icon = createFacilityIcon(f.facility_type, isSelected);
        const latlng = [f.latitude, f.longitude];
        bounds.extend(latlng);

        const actHere = (activities || []).filter((a) => a.facility_id === f.id).length;
        const popupHtml = `
        <div style="min-width:200px;font-family:-apple-system,sans-serif;">
          <div style="font-weight:600;font-size:14px;color:#1a1a1a;margin-bottom:4px;">${escapeHtml(f.name)}</div>
          <div style="color:#6B7280;font-size:12px;margin-bottom:6px;">${escapeHtml(f.address)}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <span style="background:#DBEAFE;color:#1E40AF;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:500;">${actHere} filtered activities</span>
            ${f.has_pool ? '<span style="font-size:11px;color:#0891B2;">Pool</span>' : ''}
            ${f.has_arena ? '<span style="font-size:11px;color:#7C3AED;">Arena</span>' : ''}
            ${f.has_fitness ? '<span style="font-size:11px;color:#DC2626;">Gym</span>' : ''}
          </div>
          ${f.phone ? `<div style="color:#6B7280;margin-top:5px;font-size:11px;">${escapeHtml(f.phone)}</div>` : ''}
        </div>`;

        const marker = L.marker(latlng, { icon }).addTo(map).bindPopup(popupHtml, { maxWidth: 280 });
        marker.on('click', () => onFacilityClick(f.id));
        markersRef.current[`fac-${f.id}`] = marker;
      });
    }

    const cluster = L.markerClusterGroup({
      maxClusterRadius: 52,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      chunkedLoading: true,
    });

    (activities || []).forEach((a) => {
      const lat = a.facility_lat;
      const lng = a.facility_lng;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;
      if (lat < 40 || lat > 50 || lng < -85 || lng > -75) return;

      const isSel = selectedFacility && a.facility_id === selectedFacility;
      const icon = createActivityIcon(a.category, isSel);
      const meta = CATEGORY_META[a.category] || { label: a.category || 'Activity' };
      const costLine =
        a.cost_type === 'free'
          ? '<span style="color:#15803d;font-weight:600;">Free</span>'
          : `<span style="color:#374151;">$${Number(a.cost_amount || 0).toFixed(2)}</span>`;

      const popupHtml = `
        <div style="min-width:220px;max-width:280px;font-family:-apple-system,sans-serif;">
          <div style="font-size:11px;font-weight:700;color:${escapeHtml(meta.color)};text-transform:uppercase;letter-spacing:0.03em;margin-bottom:4px;">${escapeHtml(meta.label)}</div>
          <div style="font-weight:600;font-size:14px;color:#0f172a;margin-bottom:6px;line-height:1.3;">${escapeHtml(a.name)}</div>
          <div style="font-size:12px;color:#475569;margin-bottom:4px;">${escapeHtml(a.facility_name || a.facility_id)}${a.room ? ` · ${escapeHtml(a.room)}` : ''}</div>
          <div style="font-size:12px;color:#64748b;margin-bottom:6px;">${formatDate(a.date)} · ${formatTime(a.start_time)}–${formatTime(a.end_time)}</div>
          <div style="font-size:12px;margin-bottom:8px;">${costLine}</div>
          <button type="button" class="map-popup-fac-btn" data-fid="${escapeHtml(a.facility_id)}" style="font-size:12px;color:#2563eb;background:none;border:none;padding:0;cursor:pointer;text-decoration:underline;">Filter list to this facility</button>
        </div>`;

      const marker = L.marker([lat, lng], { icon });
      marker.bindPopup(popupHtml, { maxWidth: 300 });
      marker.on('popupopen', () => {
        const btn = marker.getPopup()?.getElement()?.querySelector('.map-popup-fac-btn');
        if (btn && a.facility_id) {
          btn.onclick = () => onFacilityClick(a.facility_id);
        }
      });
      cluster.addLayer(marker);
      bounds.extend([lat, lng]);
    });

    cluster.addTo(map);
    clusterRef.current = cluster;

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
    } else if (hasActiveFilters) {
      const c = center || userLocation || { lat: 43.435, lng: -79.68 };
      map.setView([c.lat, c.lng], 12);
    }
  }, [facilitiesForMap, selectedFacility, activities, onFacilityClick, mapReady, hasActiveFilters, center, userLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedFacility) return;
    const marker = markersRef.current[`fac-${selectedFacility}`];
    if (marker) {
      map.setView(marker.getLatLng(), 14, { animate: true });
      setTimeout(() => marker.openPopup(), 300);
    }
  }, [selectedFacility]);

  return (
    <div className="relative w-full h-full" style={{ minHeight: '250px' }}>
      {mapSyncing && (
        <div
          className="pointer-events-none absolute right-2 top-2 z-[700] rounded-md border border-gray-200 bg-white/95 px-2 py-1 text-xs text-gray-600 shadow-sm"
          aria-live="polite"
        >
          Updating map\u2026
        </div>
      )}
      <div ref={mapRef} className="h-full w-full" style={{ minHeight: '250px' }} />
    </div>
  );
}
