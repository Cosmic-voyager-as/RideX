import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Map } from '../components/Map';
import { io } from 'socket.io-client';

/**
 * Figma Component: Public Live Tracking Page (Safety Link)
 * Clean Figma Theme:
 * - Electric Cobalt Blue (#0045FF / #1152FD)
 * - Canvas Background (#F7F8F9)
 * - Dark Charcoal (#3E4958) Vehicle Visualizer
 * - Soft Borders (#EDF1F7)
 */
export const TrackingPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [ride, setRide] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    // Fetch public ride details by tracking token
    const fetchRide = async () => {
      try {
        const res = await fetch(`/api/rides/track/${token}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || 'Ride tracking link not found');
        }
        setRide(data.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load tracking data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRide();

    // Connect to public tracking socket room
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    socket.emit('join_track', token);

    socket.on('driver:location', (loc: { latitude: number; longitude: number }) => {
      setDriverLocation(loc);
    });

    socket.on('ride:statusChanged', (update: any) => {
      setRide((prev: any) => (prev ? { ...prev, status: update.status } : null));
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8F9]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#0045FF] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-[#8F9BB3]">Connecting to Live Trip Radar...</span>
        </div>
      </div>
    );
  }

  if (error || !ride) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8F9] p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-[28px] shadow-lg border border-[#EDF1F7] text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl mx-auto">
            ⚠️
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#222B45]">Tracking Link Unavailable</h2>
            <p className="text-xs text-[#8F9BB3] mt-1">{error || 'This ride link is invalid or has expired.'}</p>
          </div>
          <Link
            to="/auth"
            className="inline-flex items-center justify-center h-12 px-6 bg-[#0045FF] text-white font-bold text-xs rounded-[14px] shadow-md shadow-blue-500/20 hover:bg-[#0038D1] transition"
          >
            Go to RideX Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8F9] text-[#222B45] flex flex-col font-sans">
      {/* Top Header */}
      <header className="px-6 py-4 bg-white border-b border-[#EDF1F7] flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-[12px] bg-[#0045FF] flex items-center justify-center font-black text-sm text-white shadow-md shadow-blue-500/20">
            RX
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#222B45]">RideX Live Trip Tracking</h1>
            <p className="text-[10px] text-[#8F9BB3]">Public Safety Telemetry</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-xs font-bold text-[#0045FF] font-mono bg-[#EBF3FF] px-2.5 py-0.5 rounded-full border border-blue-200">
            {ride.status}
          </span>
        </div>
      </header>

      {/* Main Tracking Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Trip Info Drawer */}
        <div className="md:col-span-4 bg-white rounded-[24px] p-6 border border-[#EDF1F7] shadow-sm space-y-5">
          {/* Dark Charcoal Vehicle Card (Figma Add card #3E4958) */}
          <div className="bg-[#3E4958] text-white rounded-[20px] p-5 shadow-md space-y-2">
            <span className="text-[10px] font-bold text-[#8F9BB3] uppercase tracking-wider block">Trip Vehicle</span>
            <div className="text-base font-bold text-white">
              {ride.vehicleCategory || 'RideX Sedan'}
            </div>
            <div className="text-xs text-blue-200 font-semibold">{ride.rideType} Ride</div>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            <div className="p-3.5 bg-[#F7F8F9] rounded-[16px] border border-[#EDF1F7]">
              <span className="text-[#8F9BB3] text-[10px] uppercase font-bold block mb-1">Pickup Location</span>
              <div className="font-bold text-[#222B45]">{ride.pickup?.address || 'Pickup Point'}</div>
            </div>
            <div className="p-3.5 bg-[#F7F8F9] rounded-[16px] border border-[#EDF1F7]">
              <span className="text-[#8F9BB3] text-[10px] uppercase font-bold block mb-1">Destination</span>
              <div className="font-bold text-[#222B45]">{ride.dropoff?.address || 'Destination Point'}</div>
            </div>
          </div>

          <div className="p-4 bg-[#EBF3FF] rounded-[18px] border border-blue-100 text-xs text-[#0045FF] space-y-1">
            <span className="font-bold block flex items-center space-x-1.5">
              <span>🛡️</span>
              <span>RideX Passenger Shield</span>
            </span>
            <p className="text-[11px] text-[#4B545A] leading-relaxed">
              This page provides encrypted real-time GPS telemetry to keep friends and family informed throughout the journey.
            </p>
          </div>
        </div>

        {/* Map View */}
        <div className="md:col-span-8 bg-white rounded-[24px] overflow-hidden border border-[#EDF1F7] shadow-sm h-[540px]">
          <Map
            pickup={ride.pickup}
            dropoff={ride.dropoff}
            driverLocation={driverLocation}
            followDriver={true}
            height="100%"
          />
        </div>
      </div>
    </div>
  );
};
