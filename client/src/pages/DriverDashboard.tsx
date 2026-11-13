import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useOOP } from '../context/OOPContext';
import { driverApi } from '../services/DriverApiService';
import { Map } from '../components/Map';
import { RideChatModal } from '../components/RideChatModal';
import { RideCallModal } from '../components/RideCallModal';
import { RideData } from '../types';

/**
 * Figma Component: Driver Dashboard (Canvas: ⚡️ Screens)
 * Adheres strictly to RideX Figma Design System:
 * - Electric Cobalt Blue (#0045FF / #1152FD)
 * - Canvas Background (#F7F8F9)
 * - White Surface Cards (#FFFFFF, rounded-[24px], border #EDF1F7)
 * - Dark Charcoal Status Passes (#3E4958)
 * - Primary Action Buttons (btn_main: h-14, rounded-[16px])
 */
export const DriverDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const {
    incomingOffer,
    clearIncomingOffer,
    activeStatusUpdate,
    driverLiveLocation,
    startSimulation
  } = useSocket();
  const { logOOPEvent } = useOOP();

  // Driver status state
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'console' | 'active' | 'earnings' | 'vehicle'>('console');

  // Active Trip State
  const [activeRide, setActiveRide] = useState<RideData | null>(null);
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);

  // Available Ride Options that can be accepted
  const [availableRequests, setAvailableRequests] = useState<RideData[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);

  const fetchAvailableRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const reqs = await driverApi.getRequests();
      setAvailableRequests(reqs);
    } catch (e) {
      console.warn('Could not fetch available requests:', e);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchAvailableRequests();
    const interval = setInterval(fetchAvailableRequests, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAcceptRideById = async (rideId: string) => {
    try {
      const accepted = await driverApi.acceptRide(rideId);
      setActiveRide(accepted);
      clearIncomingOffer();
      setActiveTab('active');
      refreshUser();
      fetchAvailableRequests();

      logOOPEvent(
        'Polymorphism',
        'Ride Accepted via Dispatch Engine',
        `Ride transition REQUESTED -> ACCEPTED. Driver locked on ON_TRIP lifecycle.`,
        `driver.acceptRide(ride);\nride.accept(driver);`
      );
    } catch (err: any) {
      alert(`Accept failed: ${err.message}`);
    }
  };

  // Incoming offer countdown
  const [countdown, setCountdown] = useState<number>(15);

  // Driver Earnings State
  const [earningsData, setEarningsData] = useState<{
    earnings: number;
    completedTrips: number;
    ratingAverage: number;
    ratingCount: number;
    status: string;
  }>({
    earnings: user?.earnings ?? 4850,
    completedTrips: 18,
    ratingAverage: user?.ratingAverage ?? 4.9,
    ratingCount: user?.ratingCount ?? 42,
    status: 'ONLINE'
  });

  // Handle incoming offer countdown timer
  useEffect(() => {
    if (incomingOffer) {
      setCountdown(15);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            clearIncomingOffer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [incomingOffer]);

  // Sync status update from socket
  useEffect(() => {
    if (activeStatusUpdate && activeRide && activeStatusUpdate.rideId === activeRide.id) {
      setActiveRide((prev) =>
        prev ? { ...prev, status: activeStatusUpdate.status as any } : null
      );
    }
  }, [activeStatusUpdate]);

  // Fetch driver earnings
  const fetchEarnings = async () => {
    try {
      const data = await driverApi.getEarnings();
      setEarningsData(data);
    } catch (e) {
      console.warn('Could not fetch latest driver earnings:', e);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [activeRide]);

  // Toggle Driver Online / Offline Status
  const handleToggleStatus = async () => {
    try {
      const newStatus = isOnline ? 'OFFLINE' : 'ONLINE';
      await driverApi.setStatus(newStatus);
      setIsOnline(!isOnline);
      refreshUser();

      logOOPEvent(
        'Encapsulation',
        `Driver Status Mutated -> ${newStatus}`,
        `Driver status transitioned safely via goOnline() / goOffline() with status invariant guards.`,
        `driver.go${newStatus === 'ONLINE' ? 'Online' : 'Offline'}();\n// Status = ${newStatus}`
      );
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  // Accept incoming offer
  const handleAcceptOffer = async () => {
    if (!incomingOffer) return;
    try {
      const accepted = await driverApi.acceptRide(incomingOffer.rideId);
      setActiveRide(accepted);
      clearIncomingOffer();
      setActiveTab('active');
      refreshUser();

      logOOPEvent(
        'Polymorphism',
        'Ride Accepted via Dispatch Engine',
        `Ride transition REQUESTED -> ACCEPTED. Driver locked on ON_TRIP lifecycle.`,
        `driver.acceptRide(ride);\nride.accept(driver);`
      );
    } catch (err: any) {
      alert(`Accept failed: ${err.message}`);
    }
  };

  // Arrive at pickup
  const handleArriveAtPickup = async () => {
    if (!activeRide) return;
    try {
      const updated = await driverApi.arriveAtPickup(activeRide.id);
      setActiveRide(updated);

      logOOPEvent(
        'Encapsulation',
        'State Transition: ACCEPTED -> ARRIVED',
        `Ride state machine transitioned to ARRIVED. Customer alerted to meet driver.`,
        `ride.arrive(); // validated transition`
      );
    } catch (err: any) {
      alert(`Arrival failed: ${err.message}`);
    }
  };

  // Start trip with Customer 4-Digit OTP
  const handleStartTripWithOtp = async () => {
    if (!activeRide) return;
    setOtpError(null);
    try {
      const started = await driverApi.startTripWithOtp(activeRide.id, otpInput);
      setActiveRide(started);
      setOtpInput('');

      // Auto start GPS simulation
      startSimulation(activeRide.id);
      setIsSimulating(true);

      logOOPEvent(
        'Encapsulation',
        'Security OTP Verification: ARRIVED -> IN_PROGRESS',
        `startWithOtp("${otpInput}") verified 4-digit PIN match against private encapsulated OTP. Trip in progress.`,
        `ride.startWithOtp(otp); // checks this._otp === enteredOtp`
      );
    } catch (err: any) {
      setOtpError(err.message || 'Invalid OTP. Please check passenger screen.');
    }
  };

  // Complete Trip
  const handleCompleteTrip = async () => {
    if (!activeRide) return;
    try {
      const completed = await driverApi.completeTrip(activeRide.id);
      setActiveRide(completed);
      setIsSimulating(false);
      await fetchEarnings();
      refreshUser();
      alert('Trip completed! Fare collected and 80% earnings credited to your balance.');

      logOOPEvent(
        'Polymorphism',
        'Trip Complete: PaymentProcessor & Earnings Split',
        `Polymorphic payment executed. EarningsTrackerObserver allocated 80% to driver and 20% platform commission.`,
        `paymentProcessor.process(ride.paymentMethod, fare.total);\nearningsTracker.notify(ride); // 80/20 split`
      );
    } catch (err: any) {
      alert(`Completion failed: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8F9] flex flex-col font-sans text-[#222B45]">
      {/* SUBNAV TAB NAVIGATION (Figma Tabs Bar) */}
      <div className="bg-white border-b border-[#EDF1F7] sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between overflow-x-auto">
          <div className="flex space-x-2">
            {[
              { id: 'console', label: 'Dispatch Console', icon: '⚡' },
              { id: 'active', label: 'Active Trip Navigation', icon: '🧭', badge: activeRide?.status },
              { id: 'earnings', label: 'My Earnings', icon: '💰' },
              { id: 'vehicle', label: 'Vehicle Profile', icon: '🚘' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-[12px] transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#EBF3FF] text-[#0045FF] border border-blue-200 shadow-xs'
                    : 'text-[#4B545A] hover:bg-[#F7F8F9]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold bg-[#0045FF] text-white animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ONLINE / OFFLINE DUTY TOGGLE (Figma Segmented Pill) */}
          <div className="flex items-center space-x-3 ml-4">
            <span className="text-xs font-bold text-[#8F9BB3] hidden sm:inline">
              Duty Status:
            </span>
            <button
              type="button"
              onClick={handleToggleStatus}
              className={`px-4 py-2 rounded-full text-xs font-bold transition shadow-xs flex items-center space-x-2 ${
                isOnline
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-[#EDF1F7] hover:bg-[#E4E9F2] text-[#8F9BB3]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-ping' : 'bg-[#8F9BB3]'}`} />
              <span>{isOnline ? 'ONLINE • ACCEPTING' : 'OFFLINE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MAIN BODY CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* TAB 1: CONSOLE */}
        {activeTab === 'console' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Status & Telemetry Card */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#EDF1F7] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#8F9BB3] uppercase tracking-wider block">
                      Driver Terminal
                    </span>
                    <h3 className="text-base font-bold text-[#222B45] tracking-tight">
                      {user?.name || 'Assigned Driver'}
                    </h3>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold ${
                      isOnline ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-gray-100 text-[#8F9BB3]'
                    }`}
                  >
                    {isOnline ? 'Ready for Dispatch' : 'Duty Off'}
                  </span>
                </div>

                {/* Registered Vehicle Visualizer (Figma Dark Charcoal #3E4958 Card) */}
                <div className="bg-[#3E4958] text-white rounded-[20px] p-4.5 shadow-md space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#8F9BB3] uppercase tracking-wider">
                      Active Vehicle
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-mono font-bold text-white tracking-wider">
                      {user?.vehicle?.type || 'SEDAN'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-[14px] bg-white/10 flex items-center justify-center text-xl">
                      🚗
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">
                        {user?.vehicle?.model || 'Silver Honda City'}
                      </div>
                      <div className="text-xs font-mono text-[#8F9BB3] mt-0.5">
                        {user?.vehicle?.plateNumber || 'KA-01-MJ-8899'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shift Metrics */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-4 bg-[#F7F8F9] rounded-[18px] border border-[#EDF1F7]">
                    <span className="text-[11px] text-[#8F9BB3] font-bold block">Today's Earnings</span>
                    <div className="text-xl font-black text-[#0045FF] mt-1">₹{earningsData.earnings}</div>
                  </div>
                  <div className="p-4 bg-[#F7F8F9] rounded-[18px] border border-[#EDF1F7]">
                    <span className="text-[11px] text-[#8F9BB3] font-bold block">Passenger Rating</span>
                    <div className="text-xl font-black text-[#222B45] mt-1">★ {earningsData.ratingAverage}</div>
                  </div>
                </div>
              </div>

              {/* Ready State Guidance */}
              <div className="bg-[#EBF3FF] p-5 rounded-[22px] border border-blue-100 text-xs text-[#0045FF] space-y-1.5">
                <span className="font-bold flex items-center space-x-2 text-sm text-[#0045FF]">
                  <span>📡</span>
                  <span>Driver Matching Strategy Active</span>
                </span>
                <p className="text-xs text-[#4B545A] leading-relaxed">
                  When a customer books, RideX ranks nearby drivers via polymorphic matching strategy and triggers a 15-second pop-up offer. Keep this screen active!
                </p>
              </div>
            </div>

            {/* Right Column: Available Ride Options + Patrol Map */}
            <div className="lg:col-span-8 space-y-5">
              {/* AVAILABLE RIDE REQUESTS LIST */}
              <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#EDF1F7] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#EDF1F7]">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <h3 className="text-base font-bold text-[#222B45]">
                        Available Passenger Ride Requests
                      </h3>
                      <p className="text-[11px] text-[#8F9BB3]">
                        {availableRequests.length} pending request{availableRequests.length !== 1 ? 's' : ''} ready to accept in Bangalore
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={fetchAvailableRequests}
                    disabled={isLoadingRequests}
                    className="px-3 py-1.5 bg-[#F7F8F9] hover:bg-[#EBF3FF] text-[#0045FF] rounded-[10px] border border-[#EDF1F7] text-xs font-bold transition flex items-center space-x-1"
                  >
                    <span>🔄</span>
                    <span>{isLoadingRequests ? 'Scanning...' : 'Refresh'}</span>
                  </button>
                </div>

                {availableRequests.length === 0 ? (
                  <div className="py-8 text-center space-y-2 bg-[#F7F8F9] rounded-[20px] border border-[#EDF1F7]">
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0045FF] flex items-center justify-center text-xl mx-auto shadow-2xs">
                      📡
                    </div>
                    <div className="text-xs font-bold text-[#222B45]">
                      No Pending Passenger Requests At This Second
                    </div>
                    <p className="text-[11px] text-[#8F9BB3] max-w-sm mx-auto">
                      Duty status is <span className="font-bold text-emerald-600">ONLINE</span>. When riders book in Bangalore, incoming requests will appear here instantly with full fare breakdown and 1-click acceptance.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {availableRequests.map((req) => {
                      const fareTotal = req.fare?.total ?? 180;
                      const driverEarnings = Math.round(fareTotal * 0.8);
                      return (
                        <div
                          key={req.id}
                          className="p-4 bg-[#F7F8F9] hover:bg-[#EBF3FF]/40 rounded-[20px] border border-[#EDF1F7] hover:border-[#0045FF]/40 transition space-y-3 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-9 h-9 rounded-full bg-white border border-[#EDF1F7] flex items-center justify-center text-base shadow-2xs">
                                👤
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-[#222B45]">
                                  {req.customerName || 'Verified Passenger'}
                                </h4>
                                <span className="text-[10px] px-2 py-0.2 rounded-full bg-white border border-[#EDF1F7] text-[#0045FF] font-bold font-mono">
                                  {req.vehicleCategory || req.vehicle?.type || 'SEDAN'} • {req.rideType || 'Standard'}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="text-sm font-black text-emerald-600">
                                Earn ₹{driverEarnings}
                              </div>
                              <div className="text-[10px] text-[#8F9BB3]">
                                Fare: ₹{fareTotal} • 80% Share
                              </div>
                            </div>
                          </div>

                          {/* Route */}
                          <div className="text-xs space-y-1.5 bg-white p-2.5 rounded-[12px] border border-[#EDF1F7]">
                            <div className="flex items-center space-x-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                              <span className="font-bold text-[#222B45]">Pickup:</span>
                              <span className="text-[#4B545A] truncate">{req.pickupLocation?.address || 'Pickup'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                              <span className="font-bold text-[#222B45]">Dropoff:</span>
                              <span className="text-[#4B545A] truncate">{req.dropoffLocation?.address || 'Dropoff'}</span>
                            </div>
                          </div>

                          {/* Footer Action */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-[#8F9BB3] font-medium">
                              Pay via: <span className="font-bold text-[#222B45]">{req.paymentMethod || 'WALLET'}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAcceptRideById(req.id)}
                              className="px-4 py-2 bg-[#0045FF] hover:bg-[#0038D1] text-white font-bold rounded-[12px] text-xs shadow-md shadow-blue-500/20 transition flex items-center space-x-1.5"
                            >
                              <span>Accept Ride</span>
                              <span>➔</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bangalore Patrol Map */}
              <div className="h-[280px] bg-white rounded-[24px] shadow-sm border border-[#EDF1F7] overflow-hidden flex flex-col">
                <div className="p-3.5 bg-[#F7F8F9] border-b border-[#EDF1F7] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#222B45]">Live Patrol Radar & Bangalore Coverage</span>
                  <span className="text-[11px] text-[#0045FF] font-bold">
                    {isOnline ? 'Online • Central Bangalore' : 'Offline'}
                  </span>
                </div>
                <div className="flex-1 relative">
                  <Map
                    pickup={{ latitude: 12.9716, longitude: 77.5946 }}
                    height="100%"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE TRIP */}
        {activeTab === 'active' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              {!activeRide ? (
                <div className="bg-white p-10 rounded-[24px] shadow-sm border border-[#EDF1F7] text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-[#F7F8F9] border border-[#EDF1F7] flex items-center justify-center text-3xl mx-auto">
                    🚖
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#222B45]">No Active Trip in Progress</h3>
                    <p className="text-xs text-[#8F9BB3] mt-1">Switch to Dispatch Console to accept incoming passenger requests.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('console')}
                    className="h-12 px-6 bg-[#0045FF] hover:bg-[#0038D1] text-white text-xs font-bold rounded-[14px] shadow-md shadow-blue-500/20 transition"
                  >
                    View Dispatch Console
                  </button>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#EDF1F7] space-y-5">
                  {/* Trip Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-[#EDF1F7]">
                    <div>
                      <span className="text-[10px] font-bold text-[#8F9BB3] uppercase tracking-wider block">
                        Lifecycle State
                      </span>
                      <h3 className="text-xl font-black text-[#0045FF] tracking-tight">
                        {activeRide.status}
                      </h3>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#222B45]">Total Fare: ₹{activeRide.fare?.total ?? 320}</div>
                      <span className="text-[11px] text-emerald-600 font-bold block mt-0.5">
                        Your 80% Share: ₹{Math.round((activeRide.fare?.total ?? 320) * 0.8)}
                      </span>
                    </div>
                  </div>

                  {/* Rider Communication Card */}
                  <div className="bg-[#F7F8F9] p-4 rounded-[18px] border border-[#EDF1F7] space-y-3">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-full bg-[#0045FF] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                        👤
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-[#222B45]">
                          {activeRide.customerName || 'Verified Passenger'}
                        </div>
                        <div className="text-xs text-[#8F9BB3]">RideX Passenger</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E4E9F2]">
                      <button
                        type="button"
                        onClick={() => setShowCallModal(true)}
                        className="py-2.5 bg-white hover:bg-blue-50 hover:text-[#0045FF] border border-[#EDF1F7] rounded-[12px] text-xs font-bold text-[#222B45] flex items-center justify-center space-x-1.5 transition shadow-2xs"
                      >
                        <span>📞</span>
                        <span>Call Passenger</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowChatModal(true)}
                        className="py-2.5 bg-white hover:bg-blue-50 hover:text-[#0045FF] border border-[#EDF1F7] rounded-[12px] text-xs font-bold text-[#222B45] flex items-center justify-center space-x-1.5 transition shadow-2xs"
                      >
                        <span>💬</span>
                        <span>Chat Passenger</span>
                      </button>
                    </div>
                  </div>

                  {/* Step Buttons Flow (Figma Progression) */}
                  <div className="space-y-3">
                    {/* Step 1: Arrive at Pickup */}
                    <div
                      className={`p-4 rounded-[18px] border transition ${
                        activeRide.status === 'ACCEPTED'
                          ? 'bg-[#EBF3FF] border-blue-200 shadow-xs'
                          : 'bg-[#F7F8F9] border-[#EDF1F7] opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-[#222B45]">Step 1: Arrive at Pickup</div>
                          <div className="text-[11px] text-[#8F9BB3]">Alert rider you have pulled up</div>
                        </div>
                        <button
                          type="button"
                          disabled={activeRide.status !== 'ACCEPTED'}
                          onClick={handleArriveAtPickup}
                          className="px-4 py-2 bg-[#0045FF] hover:bg-[#0038D1] text-white font-bold rounded-[12px] text-xs shadow-md shadow-blue-500/20 disabled:opacity-40 transition"
                        >
                          Arrived
                        </button>
                      </div>
                    </div>

                    {/* Step 2: Start Trip with OTP */}
                    <div
                      className={`p-4 rounded-[18px] border transition space-y-3 ${
                        activeRide.status === 'ARRIVED'
                          ? 'bg-[#EBF3FF] border-blue-200 shadow-xs'
                          : 'bg-[#F7F8F9] border-[#EDF1F7] opacity-60'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-[#222B45]">Step 2: Enter Passenger 4-Digit PIN</div>
                        <div className="text-[11px] text-[#8F9BB3]">Ask rider for the security OTP shown on their screen</div>
                      </div>

                      {otpError && (
                        <div className="p-2.5 bg-red-50 text-red-600 text-[11px] font-bold rounded-[10px] border border-red-200">
                          {otpError}
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          maxLength={4}
                          disabled={activeRide.status !== 'ARRIVED'}
                          value={otpInput}
                          onChange={(e) => setOtpInput(e.target.value)}
                          placeholder="0000"
                          className="w-28 text-center font-mono text-lg font-black px-3 py-2 border border-[#EDF1F7] rounded-[12px] bg-white text-[#222B45] focus:border-[#0045FF] outline-hidden shadow-xs"
                        />
                        <button
                          type="button"
                          disabled={activeRide.status !== 'ARRIVED' || otpInput.length !== 4}
                          onClick={handleStartTripWithOtp}
                          className="flex-1 py-2.5 px-4 bg-[#0045FF] hover:bg-[#0038D1] text-white font-bold rounded-[12px] text-xs shadow-md shadow-blue-500/20 disabled:opacity-40 transition"
                        >
                          Verify & Start Trip
                        </button>
                      </div>
                    </div>

                    {/* Step 3: Complete Trip */}
                    <div
                      className={`p-4 rounded-[18px] border transition ${
                        activeRide.status === 'IN_PROGRESS'
                          ? 'bg-emerald-50 border-emerald-200 shadow-xs'
                          : 'bg-[#F7F8F9] border-[#EDF1F7] opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-emerald-900">Step 3: Complete Trip & Settle</div>
                          <div className="text-[11px] text-[#8F9BB3]">
                            {isSimulating ? 'Simulating live GPS movement to dropoff...' : 'Arrived at destination'}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={activeRide.status !== 'IN_PROGRESS'}
                          onClick={handleCompleteTrip}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-[12px] text-xs shadow-md shadow-emerald-600/20 disabled:opacity-40 transition"
                        >
                          Complete Trip
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Trip Map */}
            <div className="lg:col-span-7 h-[520px] lg:h-[620px] bg-white rounded-[24px] shadow-sm border border-[#EDF1F7] overflow-hidden flex flex-col">
              <div className="p-4 bg-[#F7F8F9] border-b border-[#EDF1F7] flex items-center justify-between">
                <span className="text-xs font-bold text-[#222B45]">Turn-by-Turn GPS Navigation</span>
                <span className="text-[11px] text-[#0045FF] font-bold">Active Telemetry</span>
              </div>
              <div className="flex-1 relative">
                <Map
                  pickup={activeRide?.pickup || (activeRide as any)?.pickupLocation || { latitude: 12.9784, longitude: 77.6408 }}
                  dropoff={activeRide?.dropoff || (activeRide as any)?.dropoffLocation || { latitude: 12.9352, longitude: 77.6245 }}
                  driverLocation={driverLiveLocation}
                  followDriver={true}
                  height="100%"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EARNINGS */}
        {activeTab === 'earnings' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {/* FIGMA EARNINGS PASS (Blue Gradient Banner) */}
            <div className="bg-gradient-to-br from-[#1152FD] via-[#0045FF] to-[#0137CA] text-white rounded-[24px] p-8 shadow-xl space-y-3 relative overflow-hidden">
              <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <span className="text-xs uppercase font-bold text-blue-200 tracking-wider">
                Total Driver Earnings (80% Net)
              </span>
              <div className="text-4xl sm:text-5xl font-black tracking-tight">₹{earningsData.earnings}</div>
              <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
                Calculated strictly via EarningsTrackerObserver: 80% credited directly to driver, 20% platform commission retained. Instant automated bank payout supported.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-[20px] border border-[#EDF1F7] shadow-sm text-center">
                <span className="text-xs text-[#8F9BB3] font-bold">Completed Trips</span>
                <div className="text-2xl font-black text-[#222B45] mt-1">{earningsData.completedTrips}</div>
              </div>
              <div className="bg-white p-5 rounded-[20px] border border-[#EDF1F7] shadow-sm text-center">
                <span className="text-xs text-[#8F9BB3] font-bold">Driver Rating</span>
                <div className="text-2xl font-black text-[#0045FF] mt-1">★ {earningsData.ratingAverage}</div>
              </div>
              <div className="bg-white p-5 rounded-[20px] border border-[#EDF1F7] shadow-sm text-center">
                <span className="text-xs text-[#8F9BB3] font-bold">Total Reviews</span>
                <div className="text-2xl font-black text-[#222B45] mt-1">{earningsData.ratingCount}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: VEHICLE */}
        {activeTab === 'vehicle' && (
          <div className="max-w-2xl mx-auto bg-white p-7 rounded-[24px] shadow-sm border border-[#EDF1F7] space-y-5">
            <div>
              <span className="text-[11px] font-bold text-[#8F9BB3] uppercase tracking-wider block">
                Compliance & Telematics
              </span>
              <h3 className="text-base font-bold text-[#222B45]">Vehicle Specification & Compliance</h3>
            </div>

            {/* Dark Charcoal Visualizer Card */}
            <div className="bg-[#3E4958] text-white rounded-[20px] p-5 shadow-md flex items-center justify-between">
              <div>
                <div className="text-xs text-[#8F9BB3] uppercase tracking-wider font-bold">Model & Make</div>
                <div className="text-lg font-bold text-white mt-0.5">{user?.vehicle?.model || 'Silver Honda City'}</div>
                <div className="font-mono text-sm text-blue-300 font-bold mt-1">
                  {user?.vehicle?.plateNumber || 'KA-01-MJ-8899'}
                </div>
              </div>
              <div className="w-14 h-14 rounded-[16px] bg-white/10 flex items-center justify-center text-3xl">
                🚗
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-[#F7F8F9] rounded-[16px] flex justify-between items-center text-xs border border-[#EDF1F7]">
                <span className="font-semibold text-[#4B545A]">Vehicle Category Subclass</span>
                <span className="font-bold text-[#0045FF]">{user?.vehicle?.type || 'SEDAN'}</span>
              </div>
              <div className="p-3.5 bg-[#F7F8F9] rounded-[16px] flex justify-between items-center text-xs border border-[#EDF1F7]">
                <span className="font-semibold text-[#4B545A]">Seating Capacity</span>
                <span className="font-bold text-[#222B45]">{user?.vehicle?.seatingCapacity || 4} Passengers</span>
              </div>
              <div className="p-3.5 bg-[#F7F8F9] rounded-[16px] flex justify-between items-center text-xs border border-[#EDF1F7]">
                <span className="font-semibold text-[#4B545A]">Commercial Permit Status</span>
                <span className="font-bold text-emerald-600 flex items-center space-x-1">
                  <span>✓</span>
                  <span>Active & Verified</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INCOMING RIDE OFFER MODAL (FIGMA DIALOG: 15-SECOND COUNTDOWN) */}
      {incomingOffer && (
        <div className="fixed inset-0 z-50 bg-[#3E4958]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-4 border border-[#EDF1F7]">
            {/* Countdown Bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#0045FF] tracking-wider flex items-center space-x-1.5">
                <span>⚡</span>
                <span>INCOMING DISPATCH OFFER</span>
              </span>
              <span className="text-xs font-mono font-black bg-[#EBF3FF] text-[#0045FF] px-2.5 py-0.5 rounded-full">
                {countdown}s left
              </span>
            </div>

            {/* Countdown Visual Line (Cobalt Blue #0045FF) */}
            <div className="w-full bg-[#F7F8F9] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#0045FF] h-full transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${(countdown / 15) * 100}%` }}
              />
            </div>

            {/* Ride Route Details */}
            <div className="space-y-2.5 pt-1">
              <div className="p-3.5 bg-[#F7F8F9] rounded-[18px] border border-[#EDF1F7] space-y-2 text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="text-emerald-500 font-bold">●</span>
                  <span className="font-bold text-[#222B45] truncate">
                    Pickup: {incomingOffer.pickup.address || 'Bangalore Location'}
                  </span>
                </div>
                <div className="flex items-center space-x-2.5">
                  <span className="text-[#0045FF] font-bold">■</span>
                  <span className="font-bold text-[#222B45] truncate">
                    Dropoff: {incomingOffer.dropoff.address || 'Bangalore Location'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-center pt-1">
                <div className="p-3 bg-[#F7F8F9] rounded-[16px] border border-[#EDF1F7]">
                  <span className="text-[11px] text-[#8F9BB3] font-bold">Distance & ETA</span>
                  <div className="text-xs font-extrabold text-[#222B45] mt-0.5">
                    {incomingOffer.distanceKm} km • {incomingOffer.durationMin} min
                  </div>
                </div>

                <div className="p-3 bg-[#EBF3FF] rounded-[16px] border border-blue-200">
                  <span className="text-[11px] text-[#0045FF] font-bold">Your Share (80%)</span>
                  <div className="text-xs font-extrabold text-[#0045FF] mt-0.5">
                    ₹{Math.round(incomingOffer.estimatedFare * 0.8)}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons (Figma btn_main) */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={clearIncomingOffer}
                className="h-14 bg-[#F7F8F9] hover:bg-[#EDF1F7] text-[#4B545A] font-bold rounded-[16px] text-xs transition"
              >
                Decline
              </button>

              <button
                type="button"
                onClick={handleAcceptOffer}
                className="h-14 bg-[#0045FF] hover:bg-[#0038D1] text-white font-bold rounded-[16px] text-xs shadow-lg shadow-blue-500/20 transition flex items-center justify-center space-x-1.5"
              >
                <span>Accept Ride</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REAL-TIME IN-APP CHAT MODAL */}
      {activeRide && (
        <RideChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          rideId={activeRide.id}
          recipientName={activeRide.customerName || 'Verified Passenger'}
          recipientRole="CUSTOMER"
        />
      )}

      {/* REAL-TIME IN-APP VOICE CALL MODAL */}
      {activeRide && (
        <RideCallModal
          isOpen={showCallModal}
          onClose={() => setShowCallModal(false)}
          rideId={activeRide.id}
          recipientName={activeRide.customerName || 'Verified Passenger'}
          recipientRole="CUSTOMER"
          recipientPhone="+91 98765 00011"
        />
      )}
    </div>
  );
};
