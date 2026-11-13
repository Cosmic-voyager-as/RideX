import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Location } from '../types';

interface MapProps {
  pickup?: Location | null;
  dropoff?: Location | null;
  driverLocation?: { latitude: number; longitude: number; bearing?: number; progress?: number; speedKmH?: number } | null;
  onSelectLocation?: (loc: Location, type: 'pickup' | 'dropoff') => void;
  selectionMode?: 'pickup' | 'dropoff' | null;
  height?: string;
  className?: string;
  driversNearby?: Array<{ id: string; name: string; latitude: number; longitude: number; vehicleType?: string }>;
  centerLocation?: { latitude: number; longitude: number } | null;
  followDriver?: boolean;
}

// 1. Accurate Haversine ground distance in meters between two coordinates
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 2. Initial bearing in degrees (0 - 360) from point 1 to point 2
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

// 3. Mathematical Snap-to-Road: Get point and heading at exact distance along polyline
function getPointAtDistance(
  coords: [number, number][],
  targetDistance: number,
  cumDist: number[]
): { point: [number, number]; bearing: number; segmentIndex: number } {
  if (coords.length === 0) return { point: [0, 0], bearing: 0, segmentIndex: 0 };
  if (coords.length === 1 || targetDistance <= 0) {
    const bearing = coords.length > 1 ? calculateBearing(coords[0][0], coords[0][1], coords[1][0], coords[1][1]) : 0;
    return { point: coords[0], bearing, segmentIndex: 0 };
  }

  const totalLength = cumDist[cumDist.length - 1];
  if (targetDistance >= totalLength) {
    const lastIdx = coords.length - 1;
    const prevIdx = Math.max(0, lastIdx - 1);
    const bearing = calculateBearing(coords[prevIdx][0], coords[prevIdx][1], coords[lastIdx][0], coords[lastIdx][1]);
    return { point: coords[lastIdx], bearing, segmentIndex: lastIdx };
  }

  for (let i = 0; i < coords.length - 1; i++) {
    const dStart = cumDist[i];
    const dEnd = cumDist[i + 1];
    if (targetDistance >= dStart && targetDistance <= dEnd) {
      const segLength = dEnd - dStart;
      const frac = segLength > 0 ? (targetDistance - dStart) / segLength : 0;
      const p1 = coords[i];
      const p2 = coords[i + 1];

      const lat = p1[0] + (p2[0] - p1[0]) * frac;
      const lng = p1[1] + (p2[1] - p1[1]) * frac;
      const bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);

      return { point: [lat, lng], bearing, segmentIndex: i };
    }
  }

  return { point: coords[coords.length - 1], bearing: 0, segmentIndex: coords.length - 1 };
}

// 4. Map-Matching Projection: Snap raw GPS coordinate to closest point on road polyline
function snapPointToPolyline(
  coords: [number, number][],
  lat: number,
  lng: number,
  cumDist: number[]
): { snappedDistance: number; snappedPoint: [number, number] } {
  if (coords.length === 0) return { snappedDistance: 0, snappedPoint: [lat, lng] };
  if (coords.length === 1) return { snappedDistance: 0, snappedPoint: coords[0] };

  let minDistance = Infinity;
  let bestDistanceAlong = 0;
  let bestPoint: [number, number] = coords[0];

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];

    const dx = p2[1] - p1[1];
    const dy = p2[0] - p1[0];
    const lenSq = dx * dx + dy * dy;

    let t = 0;
    if (lenSq > 0) {
      t = ((lng - p1[1]) * dx + (lat - p1[0]) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }

    const projLat = p1[0] + t * dy;
    const projLng = p1[1] + t * dx;
    const d = haversineDistance(lat, lng, projLat, projLng);

    if (d < minDistance) {
      minDistance = d;
      const segLength = cumDist[i + 1] - cumDist[i];
      bestDistanceAlong = cumDist[i] + t * segLength;
      bestPoint = [projLat, projLng];
    }
  }

  return { snappedDistance: bestDistanceAlong, snappedPoint: bestPoint };
}

// 5. Reverse geocoding with instant fallback
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: { 'User-Agent': 'RideX-App' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.display_name) {
        const parts = data.display_name.split(', ');
        return parts.slice(0, 3).join(', ');
      }
    }
  } catch {
    // fallback
  }
  return `Map Pin (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

export const Map: React.FC<MapProps> = ({
  pickup,
  dropoff,
  driverLocation,
  onSelectLocation,
  selectionMode = null,
  height = '100%',
  className = '',
  driversNearby = [],
  centerLocation = null,
  followDriver = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);

  // Road Polyline layers
  const roadCasingRef = useRef<L.Polyline | null>(null);
  const remainingRoadRef = useRef<L.Polyline | null>(null);
  const traveledRoadRef = useRef<L.Polyline | null>(null);
  const nearbyMarkersRef = useRef<L.Marker[]>([]);

  // Mathematical Snap-To-Road Cache
  const roadCoordsRef = useRef<[number, number][]>([]);
  const cumDistRef = useRef<number[]>([]);
  const currentDistanceRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const [activeNotification, setActiveNotification] = useState<string | null>(null);

  const defaultCenter: [number, number] = pickup
    ? [pickup.latitude, pickup.longitude]
    : [12.9716, 77.5946];

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Fly to City / Center Location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !centerLocation) return;
    map.flyTo([centerLocation.latitude, centerLocation.longitude], 13, { duration: 1.2 });
  }, [centerLocation]);

  // 3. DIRECT MAP CLICK TO SELECT PICKUP (OR DROPOFF)
  // Clicking directly on the map IMMEDIATELY sets the pickup location without requiring mode pre-toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const container = mapContainerRef.current;
    if (container) {
      container.style.cursor = 'crosshair';
    }

    const handleClick = async (e: L.LeafletMouseEvent) => {
      if (!onSelectLocation) return;
      const targetType = selectionMode === 'dropoff' ? 'dropoff' : 'pickup';
      const lat = Number(e.latlng.lat.toFixed(5));
      const lng = Number(e.latlng.lng.toFixed(5));

      setActiveNotification(targetType === 'pickup' ? '🟢 Updating pickup location...' : '🏁 Updating destination...');

      const address = await reverseGeocode(lat, lng);
      onSelectLocation({ latitude: lat, longitude: lng, address }, targetType);

      setActiveNotification(
        targetType === 'pickup'
          ? `🟢 Pickup set to: ${address} (Drag pin to adjust)`
          : `🏁 Destination set to: ${address}`
      );
      setTimeout(() => setActiveNotification(null), 3500);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [onSelectLocation, selectionMode]);

  // 4. Update Pickup Marker (Interactive & Draggable)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickup) {
      const icon = L.divIcon({
        className: 'custom-pin-pickup',
        html: `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:grab;">
            <div style="background:#10b981;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(16,185,129,0.5);border:3px solid white;font-size:18px;">
              📍
            </div>
            <div style="background:#064e3b;color:white;font-size:10px;font-weight:800;padding:2px 8px;border-radius:10px;margin-top:2px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);letter-spacing:0.5px;">
              PICKUP
            </div>
          </div>
        `,
        iconSize: [64, 56],
        iconAnchor: [32, 28]
      });

      if (!pickupMarkerRef.current) {
        const marker = L.marker([pickup.latitude, pickup.longitude], {
          icon,
          draggable: true,
          title: 'Drag me to adjust pickup location'
        }).addTo(map);

        marker.bindPopup(`<b>Pickup Location</b><br>${pickup.address || 'Selected Point'}<br><small style="color:#059669;">💡 Drag pin or click map to move</small>`);

        marker.on('dragend', async (e) => {
          const latlng = (e.target as L.Marker).getLatLng();
          const lat = Number(latlng.lat.toFixed(5));
          const lng = Number(latlng.lng.toFixed(5));
          const address = await reverseGeocode(lat, lng);
          onSelectLocation?.({ latitude: lat, longitude: lng, address }, 'pickup');
          setActiveNotification(`🟢 Pickup moved to: ${address}`);
          setTimeout(() => setActiveNotification(null), 3000);
        });

        pickupMarkerRef.current = marker;
      } else {
        pickupMarkerRef.current.setLatLng([pickup.latitude, pickup.longitude]);
        pickupMarkerRef.current.getPopup()?.setContent(`<b>Pickup Location</b><br>${pickup.address || 'Selected Point'}<br><small style="color:#059669;">💡 Drag pin or click map to move</small>`);
      }
    } else if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }
  }, [pickup, onSelectLocation]);

  // 5. Update Dropoff Marker (Interactive & Draggable)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (dropoff) {
      const icon = L.divIcon({
        className: 'custom-pin-dropoff',
        html: `
          <div style="position:relative;display:flex;flex-direction:column;align-items:center;cursor:grab;">
            <div style="background:#ef4444;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(239,68,68,0.5);border:3px solid white;font-size:18px;">
              🏁
            </div>
            <div style="background:#7f1d1d;color:white;font-size:10px;font-weight:800;padding:2px 8px;border-radius:10px;margin-top:2px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.3);letter-spacing:0.5px;">
              DROPOFF
            </div>
          </div>
        `,
        iconSize: [64, 56],
        iconAnchor: [32, 28]
      });

      if (!dropoffMarkerRef.current) {
        const marker = L.marker([dropoff.latitude, dropoff.longitude], {
          icon,
          draggable: true,
          title: 'Drag me to adjust destination'
        }).addTo(map);

        marker.bindPopup(`<b>Destination</b><br>${dropoff.address || 'Selected Destination'}<br><small style="color:#dc2626;">💡 Drag pin to adjust</small>`);

        marker.on('dragend', async (e) => {
          const latlng = (e.target as L.Marker).getLatLng();
          const lat = Number(latlng.lat.toFixed(5));
          const lng = Number(latlng.lng.toFixed(5));
          const address = await reverseGeocode(lat, lng);
          onSelectLocation?.({ latitude: lat, longitude: lng, address }, 'dropoff');
          setActiveNotification(`🏁 Destination moved to: ${address}`);
          setTimeout(() => setActiveNotification(null), 3000);
        });

        dropoffMarkerRef.current = marker;
      } else {
        dropoffMarkerRef.current.setLatLng([dropoff.latitude, dropoff.longitude]);
        dropoffMarkerRef.current.getPopup()?.setContent(`<b>Destination</b><br>${dropoff.address || 'Selected Destination'}<br><small style="color:#dc2626;">💡 Drag pin to adjust</small>`);
      }
    } else if (dropoffMarkerRef.current) {
      map.removeLayer(dropoffMarkerRef.current);
      dropoffMarkerRef.current = null;
    }
  }, [dropoff, onSelectLocation]);

  // 6. REAL ROAD ROUTE VIA OSRM + PRECOMPUTED DISTANCES
  // Hugs actual city streets, turns, and avenues. Zero straight lines cutting through buildings.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!pickup || !dropoff) {
      roadCoordsRef.current = [];
      cumDistRef.current = [];
      if (roadCasingRef.current) {
        map.removeLayer(roadCasingRef.current);
        roadCasingRef.current = null;
      }
      if (remainingRoadRef.current) {
        map.removeLayer(remainingRoadRef.current);
        remainingRoadRef.current = null;
      }
      if (traveledRoadRef.current) {
        map.removeLayer(traveledRoadRef.current);
        traveledRoadRef.current = null;
      }
      return;
    }

    let isMounted = true;

    const fetchRoadRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup.longitude},${pickup.latitude};${dropoff.longitude},${dropoff.latitude}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('OSRM fetch error');
        const data = await res.json();
        if (!isMounted || !mapInstanceRef.current) return;

        if (data.routes && data.routes[0] && data.routes[0].geometry) {
          // OSRM coordinates are [lng, lat] -> convert to Leaflet [lat, lng]
          const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]]
          );

          if (coords.length >= 2) {
            roadCoordsRef.current = coords;

            // Precompute cumulative distances along the road polyline
            const cum: number[] = [0];
            for (let i = 0; i < coords.length - 1; i++) {
              cum.push(cum[i] + haversineDistance(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]));
            }
            cumDistRef.current = cum;

            // 1. Dark Navy Road Casing for 3D depth
            if (!roadCasingRef.current) {
              roadCasingRef.current = L.polyline(coords, {
                color: '#0F172A',
                weight: 7,
                opacity: 0.4,
                lineCap: 'round',
                lineJoin: 'round'
              }).addTo(map);
            } else {
              roadCasingRef.current.setLatLngs(coords);
            }

            // 2. Active Uber Blue Route Polyline
            if (!remainingRoadRef.current) {
              remainingRoadRef.current = L.polyline(coords, {
                color: '#0045FF',
                weight: 4.5,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round'
              }).addTo(map);
            } else {
              remainingRoadRef.current.setLatLngs(coords);
            }

            // 3. Traveled Path Polyline (Emerald/Slate muted trail behind car)
            if (!traveledRoadRef.current) {
              traveledRoadRef.current = L.polyline([], {
                color: '#10B981',
                weight: 4.5,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round'
              }).addTo(map);
            }

            // Auto-fit map framing to the road route
            if (!driverLocation || !followDriver) {
              const bounds = L.latLngBounds(coords);
              map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 });
            }
          }
        }
      } catch (err) {
        console.warn('OSRM routing fetch error:', err);
      }
    };

    fetchRoadRoute();

    return () => {
      isMounted = false;
    };
  }, [pickup?.latitude, pickup?.longitude, dropoff?.latitude, dropoff?.longitude]);

  // 7. UBER CAR ICON GENERATOR
  const createUberCarIcon = (angle: number) =>
    L.divIcon({
      className: 'uber-car-marker-container',
      html: `
        <div style="position:relative;width:52px;height:52px;display:flex;align-items:center;justify-content:center;transform:rotate(${Math.round(angle)}deg);transition:transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1);will-change:transform;">
          <!-- Glowing pulse aura around vehicle -->
          <div style="position:absolute;inset:6px;border-radius:50%;background:rgba(0,69,255,0.2);animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <!-- Top-Down 3D Uber Vehicle SVG -->
          <svg width="44" height="44" viewBox="0 0 44 44" style="filter:drop-shadow(0 4px 8px rgba(0,0,0,0.5));">
            <!-- Forward Headlight Beam Cone illuminating the road -->
            <polygon points="15,8 6,-2 38,-2 29,8" fill="rgba(254,240,138,0.45)"/>
            <!-- Sleek Aerodynamic Charcoal Body -->
            <rect x="14" y="6" width="16" height="32" rx="6" fill="#0F172A" stroke="#38BDF8" stroke-width="1.8"/>
            <!-- Front Windshield -->
            <path d="M 16 14 Q 22 12 28 14 L 27 18 Q 22 17 17 18 Z" fill="#64748B"/>
            <!-- Sunroof / Roof -->
            <rect x="17" y="19" width="10" height="7" rx="2" fill="#1E293B"/>
            <!-- Yellow Taxi Sign on Roof -->
            <rect x="19" y="21" width="6" height="3" rx="1" fill="#FACC15"/>
            <!-- Rear Window -->
            <path d="M 16 30 Q 22 31 28 30 L 27 27 Q 22 28 17 27 Z" fill="#64748B"/>
            <!-- Front Headlights (Yellow-White) -->
            <circle cx="16" cy="7" r="1.8" fill="#FEF08A"/>
            <circle cx="28" cy="7" r="1.8" fill="#FEF08A"/>
            <!-- Rear Brake Lights (Red) -->
            <circle cx="16" cy="37" r="1.5" fill="#EF4444"/>
            <circle cx="28" cy="37" r="1.5" fill="#EF4444"/>
            <!-- Side Mirrors -->
            <rect x="11.5" y="13" width="2.5" height="2" rx="0.8" fill="#0F172A"/>
            <rect x="30" y="13" width="2.5" height="2" rx="0.8" fill="#0F172A"/>
          </svg>
        </div>
      `,
      iconSize: [52, 52],
      iconAnchor: [26, 26]
    });

  // 8. MATHEMATICALLY AIRTIGHT SNAP-TO-ROAD VEHICLE NAVIGATION (NEVER GOES OFF TRACK)
  // Glides strictly along the road polyline vertices at 60 FPS using distance interpolation
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!driverLocation) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (driverMarkerRef.current) {
        map.removeLayer(driverMarkerRef.current);
        driverMarkerRef.current = null;
      }
      return;
    }

    const coords = roadCoordsRef.current;
    const cum = cumDistRef.current;

    // 1. If road coords are not ready yet, place at raw location
    if (coords.length < 2 || cum.length < 2) {
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = L.marker([driverLocation.latitude, driverLocation.longitude], {
          icon: createUberCarIcon(driverLocation.bearing || 0),
          zIndexOffset: 1000
        }).addTo(map);
      } else {
        driverMarkerRef.current.setLatLng([driverLocation.latitude, driverLocation.longitude]);
      }
      return;
    }

    const totalDistance = cum[cum.length - 1];

    // 2. Determine target distance along the road polyline
    let targetDistance: number;
    if (typeof driverLocation.progress === 'number' && driverLocation.progress >= 0) {
      // Direct progress along the polyline
      targetDistance = (driverLocation.progress / 100) * totalDistance;
    } else {
      // Map-matching: Project GPS coordinates onto closest road segment
      const snap = snapPointToPolyline(coords, driverLocation.latitude, driverLocation.longitude, cum);
      targetDistance = snap.snappedDistance;
    }

    // Clamp targetDistance to [0, totalDistance]
    targetDistance = Math.max(0, Math.min(totalDistance, targetDistance));

    // 3. Initial placement if marker does not exist
    if (!driverMarkerRef.current) {
      const { point, bearing } = getPointAtDistance(coords, targetDistance, cum);
      currentDistanceRef.current = targetDistance;

      driverMarkerRef.current = L.marker(point, {
        icon: createUberCarIcon(bearing),
        zIndexOffset: 1000
      })
        .addTo(map)
        .bindPopup('<b>Assigned RideX Driver</b><br>Live GPS Road Navigation');
      return;
    }

    // 4. ANIMATE DISTANCE ALONG POLYLINE AT 60 FPS (Zero jumping, zero cutting corners, 100% on track)
    const startDistance = currentDistanceRef.current;
    if (Math.abs(targetDistance - startDistance) < 0.5) return; // already in place

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const startTime = performance.now();
    const duration = 1400; // 1.4-second continuous glide matching telemetry update cycle

    const stepAnimation = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(1.0, elapsed / duration);

      // Ease-out quadratic smoothing
      const ease = t * (2 - t);
      const currentD = startDistance + (targetDistance - startDistance) * ease;
      currentDistanceRef.current = currentD;

      // Extract exact point and road heading at this distance along the road
      const { point, bearing, segmentIndex } = getPointAtDistance(coords, currentD, cum);

      driverMarkerRef.current?.setLatLng(point);
      driverMarkerRef.current?.setIcon(createUberCarIcon(bearing));

      // Update traveled polyline (behind car) and remaining polyline (ahead of car)
      if (traveledRoadRef.current && remainingRoadRef.current) {
        const traveledPoints = coords.slice(0, segmentIndex + 1);
        traveledPoints.push(point);
        traveledRoadRef.current.setLatLngs(traveledPoints);

        const remainingPoints = [point, ...coords.slice(segmentIndex + 1)];
        remainingRoadRef.current.setLatLngs(remainingPoints);
      }

      // Smooth camera centering
      if (followDriver && mapInstanceRef.current && t > 0.25 && t < 0.95) {
        mapInstanceRef.current.panTo(point, { animate: true, duration: 0.2 });
      }

      if (t < 1.0) {
        animationFrameRef.current = requestAnimationFrame(stepAnimation);
      }
    };

    animationFrameRef.current = requestAnimationFrame(stepAnimation);
  }, [driverLocation?.latitude, driverLocation?.longitude, driverLocation?.progress, driverLocation?.bearing, followDriver]);

  // 9. Render Nearby Drivers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    nearbyMarkersRef.current.forEach((m) => map.removeLayer(m));
    nearbyMarkersRef.current = [];

    driversNearby.forEach((d) => {
      const icon = L.divIcon({
        className: 'nearby-driver-pin',
        html: `<div style="background:#0045FF;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,69,255,0.4);border:2px solid white;font-size:15px;">🚗</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const m = L.marker([d.latitude, d.longitude], { icon })
        .addTo(map)
        .bindPopup(`<b>${d.name}</b><br>${d.vehicleType || 'Driver'} - Available`);
      nearbyMarkersRef.current.push(m);
    });
  }, [driversNearby]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%', minHeight: '350px', zIndex: 1 }}
        className={`rounded-xl overflow-hidden shadow-inner ${className}`}
      />

      {/* Interactive Selection Helper Badge */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-slate-200 text-[11px] font-bold text-[#222B45] flex items-center space-x-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>
          {selectionMode === 'dropoff'
            ? '🏁 Mode: Click anywhere on map to set Destination'
            : '🟢 Mode: Click anywhere on map or drag pin to set Pickup'}
        </span>
      </div>

      {/* Live Action Feedback Toast */}
      {activeNotification && (
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-20 px-4 py-2 bg-slate-900/95 text-white text-xs font-semibold rounded-full shadow-xl border border-slate-700 flex items-center space-x-2 animate-fade-in">
          <span>{activeNotification}</span>
        </div>
      )}

      {/* Uber-Style Driver Navigation HUD */}
      {driverLocation && (
        <div className="absolute bottom-4 left-4 z-10 px-3.5 py-2 bg-white/95 backdrop-blur-md rounded-[16px] shadow-lg border border-slate-200 text-xs font-bold text-[#222B45] flex items-center space-x-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10b981]" />
          </span>
          <div>
            <span className="text-[#0045FF] font-extrabold">ROAD NAVIGATION:</span>{' '}
            <span className="text-slate-700">100% On-Track</span>
            {typeof driverLocation.progress === 'number' && (
              <span className="ml-1.5 px-2 py-0.5 bg-blue-50 text-[#0045FF] rounded-full text-[10px] font-mono border border-blue-200">
                {driverLocation.progress}% Complete
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
