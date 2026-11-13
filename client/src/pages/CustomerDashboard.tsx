import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useOOP } from '../context/OOPContext';
import { customerApi } from '../services/CustomerApiService';
import { Map } from '../components/Map';
import { PaymentGatewayModal } from '../components/PaymentGatewayModal';
import { RideChatModal } from '../components/RideChatModal';
import { RideCallModal } from '../components/RideCallModal';
import { EmergencyContactsModal } from '../components/EmergencyContactsModal';
import { SosAlertModal } from '../components/SosAlertModal';
import { Location, RideData, VehicleCategory, FareBreakdown, EmergencyContact } from '../types';
import {
  ALL_INDIA_LANDMARKS,
  INDIAN_CITIES,
  CITY_CENTERS,
  IndianCity,
  getLandmarksByCity
} from '../data/indiaLocations';

// Backward compatibility alias: default landmarks in Bangalore
const BANGALORE_LANDMARKS = getLandmarksByCity('Bengaluru');

// Figma Vehicle Options matching 'car type icons' and 'option 1'
const VEHICLE_OPTIONS: { type: VehicleCategory; label: string; icon: string; capacity: number; tag: string }[] = [
  { type: 'SEDAN', label: 'RideX Sedan', icon: '🚗', capacity: 4, tag: 'Popular' },
  { type: 'AUTO', label: 'RideX Auto', icon: '🛺', capacity: 3, tag: 'Fast' },
  { type: 'BIKE', label: 'RideX Bike', icon: '🏍️', capacity: 1, tag: 'Pocket' },
  { type: 'SUV', label: 'RideX SUV', icon: '🚙', capacity: 6, tag: 'XL Seats' },
  { type: 'PREMIUM', label: 'RideX Lux', icon: '✨', capacity: 4, tag: 'Exec VIP' },
  { type: 'MINI', label: 'RideX Mini', icon: '🚘', capacity: 4, tag: 'Economy' }
];

export const CustomerDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const {
    activeStatusUpdate,
    driverLiveLocation,
    joinRideRoom,
    requestDispatch,
    triggerSos
  } = useSocket();
  const { logOOPEvent } = useOOP();

  // Navigation & Drawer states
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'book' | 'active' | 'history' | 'wallet' | 'places'>('book');

  // Sync tab with URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['book', 'active', 'history', 'wallet', 'places'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  // Booking locations (All-India Multi-City Support)
  const [selectedCity, setSelectedCity] = useState<IndianCity | 'All India'>('Bengaluru');
  const [mapSelectionMode, setMapSelectionMode] = useState<'pickup' | 'dropoff' | null>(null);
  const [cityCenter, setCityCenter] = useState<{ latitude: number; longitude: number } | null>(null);

  const [pickup, setPickup] = useState<Location>(BANGALORE_LANDMARKS[0].loc);
  const [dropoff, setDropoff] = useState<Location>(BANGALORE_LANDMARKS[1].loc);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleCategory>('SEDAN');
  const [selectedRideType, setSelectedRideType] = useState<string>('Standard');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('WALLET');
  const [promoInput, setPromoInput] = useState<string>('WELCOME50');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);

  // Available landmarks filtered by active city
  const availableLandmarks =
    selectedCity === 'All India' ? ALL_INDIA_LANDMARKS : getLandmarksByCity(selectedCity);

  const handleCityChange = (city: IndianCity | 'All India') => {
    setSelectedCity(city);
    if (city !== 'All India') {
      const center = CITY_CENTERS[city];
      setCityCenter({ latitude: center.lat, longitude: center.lng });
      const landmarks = getLandmarksByCity(city);
      if (landmarks.length >= 2) {
        setPickup(landmarks[0].loc);
        setDropoff(landmarks[1].loc);
      }
    }
  };

  const handleSelectLocationFromMap = (loc: Location, type: 'pickup' | 'dropoff') => {
    if (type === 'pickup') {
      setPickup(loc);
    } else {
      setDropoff(loc);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const myLoc: Location = {
          latitude: Number(pos.coords.latitude.toFixed(5)),
          longitude: Number(pos.coords.longitude.toFixed(5)),
          address: `My Live GPS Location (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`
        };
        setPickup(myLoc);
        setCityCenter({ latitude: myLoc.latitude, longitude: myLoc.longitude });
      },
      (err) => {
        alert(`Could not acquire GPS: ${err.message}. Please select on the map.`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSwapLocations = () => {
    const temp = pickup;
    setPickup(dropoff);
    setDropoff(temp);
  };

  // Estimates
  const [fareEstimates, setFareEstimates] = useState<Record<VehicleCategory, FareBreakdown | null>>({
    BIKE: null,
    AUTO: null,
    MINI: null,
    SEDAN: null,
    SUV: null,
    PREMIUM: null
  });
  const [distanceKm, setDistanceKm] = useState<number>(6.5);
  const [durationMin, setDurationMin] = useState<number>(20);

  // Active Ride State
  const [activeRide, setActiveRide] = useState<RideData | null>(null);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [sosSent, setSosSent] = useState<boolean>(false);
  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [showContactsModal, setShowContactsModal] = useState<boolean>(false);
  const [showSosModal, setShowSosModal] = useState<boolean>(false);

  // Emergency Contacts State (Persisted in localStorage)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(() => {
    const saved = localStorage.getItem(`ridex_emergency_contacts_${user?.id || 'default'}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      { id: 'ec-1', name: 'Rajesh Sharma', phone: '+91 98765 00099', relationship: 'Father' },
      { id: 'ec-2', name: 'Pooja Sharma', phone: '+91 98765 00088', relationship: 'Sister' }
    ];
  });

  const handleAddEmergencyContact = (contact: Omit<EmergencyContact, 'id'>) => {
    const newContact: EmergencyContact = {
      id: `ec-${Date.now()}`,
      ...contact
    };
    const updated = [...emergencyContacts, newContact];
    setEmergencyContacts(updated);
    localStorage.setItem(`ridex_emergency_contacts_${user?.id || 'default'}`, JSON.stringify(updated));
  };

  const handleDeleteEmergencyContact = (id: string) => {
    const updated = emergencyContacts.filter((c) => c.id !== id);
    setEmergencyContacts(updated);
    localStorage.setItem(`ridex_emergency_contacts_${user?.id || 'default'}`, JSON.stringify(updated));
  };

  // Rating Modal
  const [showRatingModal, setShowRatingModal] = useState<boolean>(false);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [selectedTip, setSelectedTip] = useState<number>(0);

  // History and Wallet
  const [myRides, setMyRides] = useState<RideData[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(user?.wallet?.balance ?? 1250);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [topUpSuccess, setTopUpSuccess] = useState<string | null>(null);
  const [customTopUpAmt, setCustomTopUpAmt] = useState<string>('500');

  // Payment Gateway Modal State
  const [showPaymentGateway, setShowPaymentGateway] = useState<boolean>(false);
  const [gatewayAmount, setGatewayAmount] = useState<number>(500);
  const [gatewayMode, setGatewayMode] = useState<'RIDE_PAYMENT' | 'WALLET_TOPUP'>('WALLET_TOPUP');
  const [gatewayTitle, setGatewayTitle] = useState<string>('RideX Payment Gateway');

  const loadWallet = async () => {
    try {
      const w = await customerApi.getWallet();
      if (w && typeof (w as any).balance === 'number') {
        setWalletBalance((w as any).balance);
      }
      if (w && Array.isArray((w as any).transactions)) {
        setWalletTransactions((w as any).transactions);
      }
    } catch {}
  };

  useEffect(() => {
    loadWallet();
    if (activeTab === 'history') {
      customerApi.getMyRides().then(setMyRides).catch(() => {});
    }
  }, [activeTab, activeRide]);

  // Calculate distance between pickup and dropoff
  useEffect(() => {
    if (pickup && dropoff) {
      const R = 6371; // Earth radius in km
      const dLat = ((dropoff.latitude - pickup.latitude) * Math.PI) / 180;
      const dLon = ((dropoff.longitude - pickup.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((pickup.latitude * Math.PI) / 180) *
          Math.cos((dropoff.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const calcDist = Math.max(1.5, Number((R * c).toFixed(1)));
      const calcDur = Math.max(5, Math.round(calcDist * 3.2));
      setDistanceKm(calcDist);
      setDurationMin(calcDur);
    }
  }, [pickup, dropoff]);

  // Fetch estimates whenever distance, vehicle, or promo changes
  useEffect(() => {
    const fetchEstimates = async () => {
      const results: Record<VehicleCategory, FareBreakdown | null> = {
        BIKE: null,
        AUTO: null,
        MINI: null,
        SEDAN: null,
        SUV: null,
        PREMIUM: null
      };
      for (const opt of VEHICLE_OPTIONS) {
        try {
          const res = await customerApi.estimateFare(
            opt.type,
            distanceKm,
            durationMin,
            appliedPromo || undefined
          );
          results[opt.type] = res;
        } catch {
          results[opt.type] = null;
        }
      }
      setFareEstimates(results);
    };

    fetchEstimates();
  }, [distanceKm, durationMin, appliedPromo]);

  // Socket status update sync
  useEffect(() => {
    if (activeStatusUpdate) {
      if (activeRide && activeStatusUpdate.rideId === activeRide.id) {
        setActiveRide((prev) =>
          prev
            ? {
                ...prev,
                status: activeStatusUpdate.status as any,
                driverId: activeStatusUpdate.driverId || prev.driverId,
                driverName: activeStatusUpdate.driverName || prev.driverName,
                driverPhone: activeStatusUpdate.driverPhone || prev.driverPhone,
                otp: activeStatusUpdate.otp || prev.otp,
                trackingToken: activeStatusUpdate.trackingToken || prev.trackingToken,
                vehicle: activeStatusUpdate.vehiclePlate
                  ? {
                      plateNumber: activeStatusUpdate.vehiclePlate,
                      model: activeStatusUpdate.vehicleModel || 'Honda City',
                      color: activeStatusUpdate.vehicleColor || 'Pure White',
                      type: (activeStatusUpdate.vehicleCategory as any) || prev.vehicleCategory
                    }
                  : prev.vehicle
              }
            : null
        );

        if (activeStatusUpdate.status === 'COMPLETED') {
          setShowRatingModal(true);
          refreshUser();
          loadWallet();
        }
      }
    }
  }, [activeStatusUpdate]);

  // Fast polling fallback while ride is in REQUESTED status
  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval>;
    if (activeRide && activeRide.status === 'REQUESTED') {
      pollInterval = setInterval(async () => {
        try {
          const updated = await customerApi.getRideById(activeRide.id);
          if (updated && updated.status !== 'REQUESTED') {
            setActiveRide(updated);
          }
        } catch {}
      }, 2000);
    }
    return () => clearInterval(pollInterval);
  }, [activeRide?.id, activeRide?.status]);

  // Handle Ride Booking
  const handleBookRide = async () => {
    try {
      const estimatedFare = fareEstimates[selectedVehicle]?.total || 0;
      if (selectedPaymentMethod === 'WALLET' && walletBalance < estimatedFare) {
        alert(
          `Insufficient RideX Wallet balance (Current: ₹${walletBalance.toFixed(2)}, Required: ₹${estimatedFare.toFixed(2)}).\n\nPlease recharge your wallet or choose Cash / UPI / Card.`
        );
        setActiveTab('wallet');
        return;
      }

      const newRide = await customerApi.bookRide({
        pickup,
        dropoff,
        vehicleCategory: selectedVehicle,
        rideType: selectedRideType,
        paymentMethod: selectedPaymentMethod,
        distanceKm,
        durationMin,
        promoCode: appliedPromo || undefined
      });

      setActiveRide(newRide);
      setActiveTab('active');
      joinRideRoom(newRide.id);

      // Trigger dispatch engine
      requestDispatch(newRide.id);

      // Setup tracking URL
      if ((newRide as any).trackingToken) {
        setTrackingUrl(`${window.location.origin}/track/${(newRide as any).trackingToken}`);
      }

      logOOPEvent(
        'Encapsulation',
        `Ride State Machine Instantiated -> REQUESTED`,
        `New ${selectedRideType}Ride created with validated state transitions. Driver matching initiated.`,
        `const ride = new ${selectedRideType}Ride(customerId, pickup, dropoff, ...);\nride.setState('REQUESTED');`
      );
    } catch (err: any) {
      alert(`Booking failed: ${err.message}`);
    }
  };

  // Handle Ride Cancellation
  const handleCancelRide = async () => {
    if (!activeRide) return;
    try {
      const res = await customerApi.cancelRide(activeRide.id, 'Customer requested cancellation');
      alert(`Ride cancelled. Cancellation Fee: ₹${res.cancellationFee}`);
      setActiveRide(null);
      setActiveTab('book');
      refreshUser();
      loadWallet();

      logOOPEvent(
        'Polymorphism',
        'Polymorphic Cancellation Fee Evaluation',
        `Cancellation fee calculated via Ride.getCancellationFee() based on the concrete ride subclass and trip status.`,
        `const fee = ride.getCancellationFee(); // Evaluated polymorphically per subclass`
      );
    } catch (err: any) {
      alert(`Cancellation failed: ${err.message}`);
    }
  };

  // Submit Driver Rating
  const handleSubmitRating = async () => {
    if (!activeRide) return;
    try {
      await customerApi.rateDriver(activeRide.id, ratingScore, ratingComment);
      setShowRatingModal(false);
      setActiveRide(null);
      alert('Thank you! Your driver rating and feedback have been recorded.');
      refreshUser();
      loadWallet();
    } catch (err: any) {
      alert(`Rating failed: ${err.message}`);
    }
  };

  // Open Payment Gateway for Wallet Top-up
  const handleOpenGatewayForTopUp = (amount: number) => {
    if (amount <= 0) {
      alert('Please enter a valid recharge amount');
      return;
    }
    setGatewayAmount(amount);
    setGatewayMode('WALLET_TOPUP');
    setGatewayTitle('Recharge RideX Digital Wallet');
    setShowPaymentGateway(true);
  };

  // Open Payment Gateway for Ride Inspection
  const handleOpenGatewayForRidePayment = () => {
    const total = fareEstimates[selectedVehicle]?.total || 150;
    setGatewayAmount(total);
    setGatewayMode('RIDE_PAYMENT');
    setGatewayTitle(`RideX Checkout (${selectedVehicle})`);
    setShowPaymentGateway(true);
  };

  // Gateway Success Callback
  const handleGatewaySuccess = async (details: {
    method: 'RAZORPAY' | 'UPI' | 'CARD' | 'WALLET' | 'NETBANKING' | 'CASH';
    transactionId: string;
    amount: number;
    channelInfo?: string;
  }) => {
    if (gatewayMode === 'WALLET_TOPUP') {
      try {
        const desc = `Recharge via ${details.channelInfo || details.method} (Ref: ${details.transactionId})`;
        const res = await customerApi.topUpWallet(details.amount, desc);
        setWalletBalance(res.balance);
        setTopUpSuccess(`Payment Verified! Credited ₹${details.amount.toFixed(2)} to RideX Wallet.`);
        await loadWallet();
        refreshUser();
        setTimeout(() => setTopUpSuccess(null), 5000);
      } catch (err: any) {
        alert(`Wallet update failed: ${err.message}`);
      }
    } else {
      setSelectedPaymentMethod(details.method);
      alert(`Payment channel pre-authorized via ${details.channelInfo || details.method}.`);
    }
  };

  // SOS Emergency Trigger with direct location messaging to emergency contacts
  const handleSos = () => {
    const lat = driverLiveLocation?.latitude || pickup.latitude || 12.9716;
    const lng = driverLiveLocation?.longitude || pickup.longitude || 77.5946;
    const locationLink = activeRide?.trackingToken
      ? `${window.location.origin}/track/${activeRide.trackingToken}`
      : `https://maps.google.com/?q=${lat},${lng}`;

    const sosMessage = `🚨 EMERGENCY ALERT: I am in distress on my RideX ride (Trip ID: ${activeRide?.id || 'Active'}). Live GPS Location: ${locationLink} (Lat: ${lat}, Lng: ${lng}). Please send emergency assistance immediately!`;

    // 1. Dispatch emergency signal over Socket.IO to admin
    triggerSos(activeRide?.id || 'emergency-sos', 'Customer triggered in-app emergency SOS');
    setSosSent(true);

    // 2. Direct message dispatch: trigger SMS URI to primary emergency contact
    if (emergencyContacts.length > 0) {
      const primary = emergencyContacts[0];
      const cleanPhone = primary.phone.replace(/[\s-]/g, '');
      try {
        window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(sosMessage)}`;
      } catch (e) {
        console.warn('SMS dispatch trigger notice:', e);
      }
    }

    // 3. Open full SOS Modal with direct messaging buttons for all contacts + 112 emergency call
    setShowSosModal(true);
    setTimeout(() => setSosSent(false), 8000);
  };

  return (
    <div className="min-h-screen bg-[#F7F8F9] flex flex-col font-sans text-[#222B45]">
      {/* SUB-HEADER PILL NAVIGATION (Matching Figma tabs 1 & 2) */}
      <div className="bg-white border-b border-[#EDF1F7] sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between overflow-x-auto">
          <div className="flex space-x-2">
            {[
              { id: 'book', label: 'Book Ride', icon: '🗺️' },
              { id: 'active', label: 'Active Trip', icon: '🚕', badge: activeRide ? activeRide.status : null },
              { id: 'history', label: 'History', icon: '📜' },
              { id: 'wallet', label: 'Wallet', icon: '💳', pill: `₹${walletBalance.toFixed(0)}` },
              { id: 'places', label: 'Saved Places', icon: '📍' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSearchParams({ tab: tab.id });
                }}
                className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-bold rounded-[12px] transition ${
                  activeTab === tab.id
                    ? 'bg-[#EBF3FF] text-[#0045FF] border border-blue-200 shadow-xs'
                    : 'text-[#4B545A] hover:bg-[#F7F8F9]'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-extrabold bg-emerald-600 text-white animate-pulse">
                    {tab.badge}
                  </span>
                )}
                {tab.pill && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-[#0045FF] text-white">
                    {tab.pill}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowContactsModal(true)}
              className="text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-[10px] transition flex items-center space-x-1.5 shadow-2xs"
              title="Manage Emergency SOS Contacts & Settings"
            >
              <span>🛡️</span>
              <span>SOS Contacts ({emergencyContacts.length})</span>
            </button>
            <div className="hidden sm:flex items-center space-x-2 text-xs font-bold text-[#8F9BB3] pl-2 border-l border-[#EDF1F7]">
              <span>Grid: Bangalore CBD</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1 w-full">
        {/* TAB 1: BOOK RIDE (Figma Screens: Booking, Ride options) */}
        {activeTab === 'book' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT CONTROL PANEL (Bottom sheet style in Figma) */}
            <div className="lg:col-span-5 space-y-4">
              {/* FIGMA SEARCH FIELD & ROUTE CARD (ALL-INDIA MULTI-CITY BOOKING) */}
              <div className="bg-white p-5 rounded-[20px] shadow-sm border border-[#EDF1F7] space-y-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-[#EDF1F7]">
                  <span className="text-xs font-bold text-[#222B45] flex items-center space-x-2">
                    <span className="text-[#0045FF]">📍</span>
                    <span>All-India Route Configuration</span>
                  </span>
                  <span className="text-xs font-bold text-[#0045FF] bg-[#EBF3FF] px-2 py-0.5 rounded-full">
                    {distanceKm} km • {durationMin} mins
                  </span>
                </div>

                {/* City Filter Pills */}
                <div>
                  <span className="text-[10px] font-bold text-[#8F9BB3] uppercase block mb-1.5">
                    Select Operating Metro / Region:
                  </span>
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                    {(['All India', ...INDIAN_CITIES] as const).map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => handleCityChange(city as any)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition ${
                          selectedCity === city
                            ? 'bg-[#0045FF] text-white shadow-xs'
                            : 'bg-[#F7F8F9] text-[#4B545A] hover:bg-[#EBF3FF] hover:text-[#0045FF] border border-[#EDF1F7]'
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Map Tools Row */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="px-2.5 py-1.5 bg-[#ECFDF5] hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-[10px] border border-emerald-200 flex items-center space-x-1 transition"
                    title="Set pickup to my real physical GPS location"
                  >
                    <span>🎯</span>
                    <span>My GPS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapSelectionMode('pickup')}
                    className={`px-2.5 py-1.5 text-[10px] font-bold rounded-[10px] border flex items-center space-x-1 transition ${
                      mapSelectionMode !== 'dropoff'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-[#F7F8F9] hover:bg-[#EBF3FF] text-[#222B45] border-[#EDF1F7]'
                    }`}
                    title="Click or drag on the map to set pickup"
                  >
                    <span>📍</span>
                    <span>{mapSelectionMode !== 'dropoff' ? 'Pickup (Active)' : 'Pin Pickup'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapSelectionMode(mapSelectionMode === 'dropoff' ? 'pickup' : 'dropoff')}
                    className={`px-2.5 py-1.5 text-[10px] font-bold rounded-[10px] border flex items-center space-x-1 transition ${
                      mapSelectionMode === 'dropoff'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-[#F7F8F9] hover:bg-[#EBF3FF] text-[#222B45] border-[#EDF1F7]'
                    }`}
                    title="Click on the map to set dropoff destination"
                  >
                    <span>🏁</span>
                    <span>{mapSelectionMode === 'dropoff' ? 'Dropoff (Active)' : 'Pin Dropoff'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSwapLocations}
                    className="px-2.5 py-1.5 bg-[#F7F8F9] hover:bg-[#EBF3FF] text-[#4B545A] hover:text-[#0045FF] rounded-[10px] border border-[#EDF1F7] text-[10px] font-bold transition flex items-center space-x-1"
                    title="Swap Pickup & Destination"
                  >
                    <span>⇄</span>
                    <span>Swap</span>
                  </button>
                </div>

                {/* Pickup Dropdown & Active Pin */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#8F9BB3] uppercase flex items-center space-x-1">
                      <span>🟢 Pickup Location</span>
                    </label>
                    <span className="text-[10px] text-emerald-600 font-mono font-bold">
                      {pickup.latitude.toFixed(4)}, {pickup.longitude.toFixed(4)}
                    </span>
                  </div>
                  <select
                    value={pickup.address}
                    onChange={(e) => {
                      const found = availableLandmarks.find((l) => l.loc.address === e.target.value);
                      if (found) setPickup(found.loc);
                    }}
                    className="w-full text-xs font-bold px-3 py-2.5 border border-[#E4E9F2] rounded-[14px] bg-[#F7F8F9] text-[#222B45] focus:outline-none focus:border-[#0045FF] focus:bg-white"
                  >
                    {!availableLandmarks.some((l) => l.loc.address === pickup.address) && (
                      <option value={pickup.address}>
                        📍 Selected on Map: {pickup.address}
                      </option>
                    )}
                    {availableLandmarks.map((lm) => (
                      <option key={`pick-${lm.id || lm.name}`} value={lm.loc.address}>
                        {lm.city ? `[${lm.city}] ` : ''}{lm.name} ({lm.category || 'Landmark'})
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 px-2.5 py-1.5 bg-emerald-50 rounded-[10px] border border-emerald-100 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-emerald-900 truncate">
                      🟢 {pickup.address}
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold shrink-0 ml-1">
                      Drag pin on map to adjust
                    </span>
                  </div>
                </div>

                {/* Dropoff Dropdown & Active Pin */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-[#8F9BB3] uppercase flex items-center space-x-1">
                      <span>🏁 Dropoff Destination</span>
                    </label>
                    <span className="text-[10px] text-rose-600 font-mono font-bold">
                      {dropoff.latitude.toFixed(4)}, {dropoff.longitude.toFixed(4)}
                    </span>
                  </div>
                  <select
                    value={dropoff.address}
                    onChange={(e) => {
                      const found = availableLandmarks.find((l) => l.loc.address === e.target.value);
                      if (found) setDropoff(found.loc);
                    }}
                    className="w-full text-xs font-bold px-3 py-2.5 border border-[#E4E9F2] rounded-[14px] bg-[#F7F8F9] text-[#222B45] focus:outline-none focus:border-[#0045FF] focus:bg-white"
                  >
                    {!availableLandmarks.some((l) => l.loc.address === dropoff.address) && (
                      <option value={dropoff.address}>
                        🏁 Selected Destination: {dropoff.address}
                      </option>
                    )}
                    {availableLandmarks.map((lm) => (
                      <option key={`drop-${lm.id || lm.name}`} value={lm.loc.address}>
                        {lm.city ? `[${lm.city}] ` : ''}{lm.name} ({lm.category || 'Landmark'})
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 px-2.5 py-1.5 bg-rose-50 rounded-[10px] border border-rose-100 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-rose-900 truncate">
                      🏁 {dropoff.address}
                    </span>
                    <span className="text-[10px] text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded font-bold shrink-0 ml-1">
                      Destination
                    </span>
                  </div>
                </div>

                {/* Quick Landmark Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {availableLandmarks.slice(0, 5).map((lm) => (
                    <button
                      key={`chip-${lm.id || lm.name}`}
                      type="button"
                      onClick={() => setDropoff(lm.loc)}
                      className="px-2.5 py-1 bg-[#F7F8F9] hover:bg-[#EBF3FF] hover:text-[#0045FF] text-[10px] font-bold text-[#4B545A] rounded-[10px] border border-[#EDF1F7] transition"
                    >
                      To {lm.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* FIGMA CAR TYPE OPTIONS: option 1 & btn_cartype */}
              <div className="bg-white p-5 rounded-[20px] shadow-sm border border-[#EDF1F7] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#222B45] uppercase tracking-wider">
                    Select Vehicle Class
                  </span>
                  <span className="text-[11px] font-bold text-[#0045FF]">Figma Carson Fleet</span>
                </div>

                {/* Ride Type Selector (OOP Polymorphic Rides) */}
                <div className="flex space-x-1.5 overflow-x-auto pb-1">
                  {['Standard', 'Shared', 'Scheduled', 'Outstation'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedRideType(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                        selectedRideType === type
                          ? 'bg-[#0045FF] text-white shadow-xs'
                          : 'bg-[#F7F8F9] text-[#4B545A] hover:bg-[#EDF1F7]'
                      }`}
                    >
                      {type} Ride
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {VEHICLE_OPTIONS.map((v) => {
                    const estimate = fareEstimates[v.type];
                    const isSelected = selectedVehicle === v.type;
                    return (
                      <div
                        key={v.type}
                        onClick={() => setSelectedVehicle(v.type)}
                        className={`p-3 rounded-[16px] border cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#EBF3FF] border-[#0045FF] shadow-sm ring-2 ring-[#0045FF]/20'
                            : 'bg-white border-[#EDF1F7] hover:border-slate-300 hover:bg-[#F7F8F9]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">{v.icon}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-[#4B545A]">
                            👤 {v.capacity}
                          </span>
                        </div>
                        <div className="mt-2">
                          <div className="text-xs font-bold text-[#222B45] truncate">{v.label}</div>
                          <div className="text-xs font-black text-[#0045FF] mt-0.5">
                            {estimate ? `₹${estimate.total}` : '...'}
                          </div>
                          <div className="text-[10px] text-[#8F9BB3] font-medium mt-0.5">3 min away</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* PAYMENT & PROMO ROW (Figma payment & coupon) */}
              <div className="bg-white p-5 rounded-[20px] shadow-sm border border-[#EDF1F7] space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#222B45] uppercase tracking-wider">
                    Payment Channel
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenGatewayForRidePayment}
                    className="text-xs font-bold text-[#0045FF] hover:underline flex items-center space-x-1"
                  >
                    <span>🛡️ Gateway Preview</span>
                    <span>➔</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {/* RAZORPAY */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('RAZORPAY')}
                    className={`p-2.5 rounded-[14px] border text-left transition flex flex-col justify-between ${
                      selectedPaymentMethod === 'RAZORPAY'
                        ? 'border-[#0045FF] bg-[#EBF3FF] ring-1 ring-[#0045FF]'
                        : 'border-[#EDF1F7] hover:border-slate-300 bg-[#F7F8F9]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">⚡</span>
                      <span className="text-[8px] font-bold px-1 py-0.2 rounded-full bg-blue-600 text-white">
                        LIVE
                      </span>
                    </div>
                    <div className="mt-1">
                      <div className="text-[11px] font-bold text-[#222B45] truncate">Razorpay</div>
                      <div className="text-[10px] text-[#0045FF] font-bold">UPI / Cards</div>
                    </div>
                  </button>

                  {/* WALLET */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('WALLET')}
                    className={`p-2.5 rounded-[14px] border text-left transition flex flex-col justify-between ${
                      selectedPaymentMethod === 'WALLET'
                        ? 'border-[#0045FF] bg-[#EBF3FF] ring-1 ring-[#0045FF]'
                        : 'border-[#EDF1F7] hover:border-slate-300 bg-[#F7F8F9]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">👛</span>
                      <span className="text-[8px] font-bold px-1 py-0.2 rounded-full bg-[#0045FF] text-white">
                        FAST
                      </span>
                    </div>
                    <div className="mt-1">
                      <div className="text-[11px] font-bold text-[#222B45] truncate">Wallet</div>
                      <div className="text-[10px] text-[#0045FF] font-bold">₹{walletBalance.toFixed(0)}</div>
                    </div>
                  </button>

                  {/* UPI */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('UPI')}
                    className={`p-2.5 rounded-[14px] border text-left transition flex flex-col justify-between ${
                      selectedPaymentMethod === 'UPI'
                        ? 'border-[#0045FF] bg-[#EBF3FF] ring-1 ring-[#0045FF]'
                        : 'border-[#EDF1F7] hover:border-slate-300 bg-[#F7F8F9]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">📱</span>
                      <span className="text-[8px] font-bold px-1 py-0.2 rounded-full bg-blue-100 text-blue-800">
                        UPI
                      </span>
                    </div>
                    <div className="mt-1">
                      <div className="text-[11px] font-bold text-[#222B45] truncate">GPay / PhonePe</div>
                      <div className="text-[10px] text-[#8F9BB3] truncate">Instant push</div>
                    </div>
                  </button>

                  {/* CARD */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('CARD')}
                    className={`p-2.5 rounded-[14px] border text-left transition flex flex-col justify-between ${
                      selectedPaymentMethod === 'CARD'
                        ? 'border-[#0045FF] bg-[#EBF3FF] ring-1 ring-[#0045FF]'
                        : 'border-[#EDF1F7] hover:border-slate-300 bg-[#F7F8F9]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">💳</span>
                      <span className="text-[8px] font-bold px-1 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
                        3D
                      </span>
                    </div>
                    <div className="mt-1">
                      <div className="text-[11px] font-bold text-[#222B45] truncate">Cards</div>
                      <div className="text-[10px] text-[#8F9BB3] truncate">Visa / Master</div>
                    </div>
                  </button>

                  {/* CASH */}
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('CASH')}
                    className={`p-2.5 rounded-[14px] border text-left transition flex flex-col justify-between ${
                      selectedPaymentMethod === 'CASH'
                        ? 'border-[#0045FF] bg-[#EBF3FF] ring-1 ring-[#0045FF]'
                        : 'border-[#EDF1F7] hover:border-slate-300 bg-[#F7F8F9]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">💵</span>
                      <span className="text-[8px] font-bold px-1 py-0.2 rounded-full bg-green-100 text-green-800">
                        COD
                      </span>
                    </div>
                    <div className="mt-1">
                      <div className="text-[11px] font-bold text-[#222B45] truncate">Cash</div>
                      <div className="text-[10px] text-[#8F9BB3] truncate">Pay to driver</div>
                    </div>
                  </button>
                </div>

                {/* Promo Code Input */}
                <div className="flex items-center space-x-2 pt-2 border-t border-[#EDF1F7]">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon (WELCOME50)"
                    className="flex-1 text-xs px-3.5 py-2 border border-[#E4E9F2] rounded-[12px] uppercase font-mono font-bold bg-[#F7F8F9] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setAppliedPromo(promoInput);
                      alert(`Promo code ${promoInput} applied!`);
                    }}
                    className="px-4 py-2 bg-[#222B45] hover:bg-[#0045FF] text-white rounded-[12px] text-xs font-bold transition shadow-xs"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* FIGMA PRIMARY BUTTON: btn_main (height 56px, #0045FF, rounded-[16px]) */}
              <button
                type="button"
                onClick={handleBookRide}
                className="w-full h-14 bg-[#0045FF] hover:bg-[#0038D1] text-white font-black rounded-[16px] shadow-xl shadow-blue-500/30 transition flex items-center justify-center space-x-2 text-base tracking-wide"
              >
                <span>Confirm & Book {selectedVehicle}</span>
                <span>•</span>
                <span>₹{fareEstimates[selectedVehicle]?.total ?? '...'}</span>
              </button>
            </div>

            {/* RIGHT PANEL: LEAFLET MAP (Matching Figma map_style-1 with All-India Coverage) */}
            <div className="lg:col-span-7 flex flex-col h-[520px] lg:h-[640px] bg-white rounded-[24px] shadow-sm border border-[#EDF1F7] overflow-hidden">
              <div className="p-3.5 bg-[#F7F8F9] border-b border-[#EDF1F7] flex items-center justify-between">
                <span className="text-xs font-bold text-[#222B45] flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0045FF] animate-pulse" />
                  <span>{selectedCity} Live Telemetry &amp; Navigation Grid</span>
                </span>
                <span className="text-[11px] text-[#8F9BB3] font-mono">
                  {pickup.address?.split(',')[0]} ➔ {dropoff.address?.split(',')[0]}
                </span>
              </div>
              <div className="flex-1 relative">
                <Map
                  pickup={pickup}
                  dropoff={dropoff}
                  driverLocation={
                    driverLiveLocation
                      ? {
                          latitude: driverLiveLocation.latitude,
                          longitude: driverLiveLocation.longitude,
                          progress: (driverLiveLocation as any).progress,
                          speedKmH: (driverLiveLocation as any).speedKmH
                        }
                      : null
                  }
                  centerLocation={cityCenter}
                  onSelectLocation={handleSelectLocationFromMap}
                  selectionMode={mapSelectionMode}
                  height="100%"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE RIDE (Figma Screens: Searching for a driver, Arriving, On-trip) */}
        {activeTab === 'active' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              {!activeRide ? (
                <div className="bg-white p-8 rounded-[24px] shadow-sm border border-[#EDF1F7] text-center space-y-3">
                  <span className="text-4xl">🚕</span>
                  <h3 className="text-base font-bold text-[#222B45]">No Active Ride</h3>
                  <p className="text-xs text-[#8F9BB3]">You do not have any ongoing trip at this moment.</p>
                  <button
                    onClick={() => setActiveTab('book')}
                    className="px-5 py-2.5 bg-[#0045FF] text-white text-xs font-bold rounded-[14px] shadow-md hover:bg-[#0038D1] transition"
                  >
                    Book a Ride Now
                  </button>
                </div>
              ) : activeRide.status === 'REQUESTED' ? (
                /* STATE 1: REQUESTED -> Searching for Nearby Drivers (No Driver Confirmed Yet) */
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#EDF1F7] space-y-6">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#EDF1F7]">
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        ⚡ Dispatch Matching Underway
                      </span>
                      <h3 className="text-2xl font-black text-[#222B45] tracking-tight mt-1 flex items-center space-x-2">
                        <span>REQUESTED</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#8F9BB3] font-mono">ID: {activeRide.id.slice(0, 8)}...</span>
                      <div className="text-sm font-black text-[#0045FF]">₹{activeRide.fare?.total ?? 0}</div>
                    </div>
                  </div>

                  {/* Dynamic Radar Pulse Searching Animation */}
                  <div className="relative py-8 flex flex-col items-center justify-center bg-gradient-to-b from-[#F7F8F9] to-white rounded-[22px] border border-[#EDF1F7] overflow-hidden">
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping" />
                      <div className="absolute inset-3 rounded-full bg-blue-500/20 animate-pulse" />
                      <div className="w-14 h-14 rounded-full bg-[#0045FF] text-white flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30 z-10">
                        🚖
                      </div>
                    </div>
                    <div className="mt-4 text-center px-4">
                      <span className="text-sm font-bold text-[#222B45] block">
                        Looking for nearby {selectedVehicle} drivers...
                      </span>
                      <span className="text-xs text-[#8F9BB3] mt-1 block">
                        NearestDriverStrategy scoring available drivers in Bengaluru
                      </span>
                    </div>
                  </div>

                  {/* Route Summary */}
                  <div className="p-4 bg-[#F7F8F9] rounded-[18px] border border-[#EDF1F7] space-y-2 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="font-bold text-[#222B45]">Pickup:</span>
                      <span className="text-[#4B545A] truncate">{pickup.address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span className="font-bold text-[#222B45]">Dropoff:</span>
                      <span className="text-[#4B545A] truncate">{dropoff.address}</span>
                    </div>
                  </div>

                  {/* Action Buttons: Emergency Contacts + Cancel */}
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowContactsModal(true)}
                      className="px-4 py-3 bg-[#F7F8F9] hover:bg-slate-100 text-[#222B45] font-bold text-xs rounded-[14px] border border-[#EDF1F7] transition flex items-center space-x-1"
                    >
                      <span>🛡️ Emergency Contacts</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelRide}
                      className="flex-1 py-3 bg-[#F7F8F9] hover:bg-rose-50 text-[#4B545A] hover:text-rose-600 font-bold text-xs rounded-[14px] border border-[#EDF1F7] hover:border-rose-200 transition"
                    >
                      Cancel Request
                    </button>
                  </div>
                </div>
              ) : (
                /* STATE 2: CONFIRMED / ACCEPTED / IN_PROGRESS -> Driver Assigned */
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-[#EDF1F7] space-y-5">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#EDF1F7]">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        ✓ Trip Confirmed & Driver Assigned
                      </span>
                      <h3 className="text-2xl font-black text-[#222B45] tracking-tight mt-1 flex items-center space-x-2">
                        <span>{activeRide.status === 'ACCEPTED' ? 'CONFIRMED' : activeRide.status}</span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-[#8F9BB3] font-mono">ID: {activeRide.id.slice(0, 8)}...</span>
                      <div className="text-sm font-black text-[#0045FF]">₹{activeRide.fare?.total ?? 0}</div>
                    </div>
                  </div>

                  {/* FIGMA 4-DIGIT SECURITY PIN: Verify code */}
                  <div className="bg-[#EBF3FF] border border-blue-200 rounded-[18px] p-4 text-center">
                    <span className="text-[11px] font-bold text-[#0045FF] uppercase tracking-wider block mb-1">
                      🔒 Your 4-Digit Security Start PIN
                    </span>
                    <div className="text-3xl font-black text-[#222B45] tracking-widest font-mono">
                      {(activeRide as any).otp || '7842'}
                    </div>
                    <span className="text-[11px] text-[#4B545A] mt-1 block">
                      Share this PIN with your driver to verify identity and start your trip.
                    </span>
                  </div>

                  {/* FIGMA DRIVER DETAILS CARD: Driver details (333x127) */}
                  <div className="bg-[#F7F8F9] p-4 rounded-[18px] border border-[#EDF1F7] space-y-3">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-full bg-[#0045FF] text-white flex items-center justify-center font-black text-base shadow-sm">
                        🚖
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-[#222B45]">
                            {activeRide.driverName || 'Manoj Reddy'}
                          </h4>
                          <span className="text-xs font-bold text-amber-500 flex items-center space-x-1">
                            <span>★</span>
                            <span>4.9</span>
                          </span>
                        </div>
                        <div className="text-xs text-[#4B545A] font-medium">
                          {activeRide.vehicle?.model || 'Honda City'} • {activeRide.vehicle?.color || 'Pure White'}
                        </div>
                        <div className="mt-1 inline-block px-2 py-0.5 bg-white border border-[#E4E9F2] rounded-md text-[10px] font-mono font-bold text-[#222B45]">
                          {activeRide.vehicle?.plateNumber || 'KA-04-SD-4444'}
                        </div>
                      </div>
                    </div>

                    {/* ACTION BUTTONS: Call (Direct), Chat, Emergency Contacts, SOS */}
                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[#E4E9F2]">
                      <button
                        type="button"
                        onClick={() => setShowCallModal(true)}
                        className="py-2.5 bg-white hover:bg-emerald-50 hover:text-emerald-700 border border-[#EDF1F7] rounded-[12px] text-xs font-bold text-[#222B45] flex items-center justify-center space-x-1.5 transition shadow-2xs"
                        title={`Direct Call Registered Number: ${activeRide.driverPhone || '+91 98765 00024'}`}
                      >
                        <span>📞</span>
                        <span>Call</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowChatModal(true)}
                        className="py-2.5 bg-white hover:bg-blue-50 hover:text-[#0045FF] border border-[#EDF1F7] rounded-[12px] text-xs font-bold text-[#222B45] flex items-center justify-center space-x-1.5 transition shadow-2xs"
                      >
                        <span>💬</span>
                        <span>Chat</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowContactsModal(true)}
                        className="py-2.5 bg-white hover:bg-slate-100 border border-[#EDF1F7] rounded-[12px] text-xs font-bold text-[#222B45] flex items-center justify-center space-x-1.5 transition shadow-2xs"
                        title="Manage Emergency SOS Contacts"
                      >
                        <span>🛡️</span>
                        <span>Contacts</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSos}
                        className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 rounded-[12px] text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-sm"
                        title="Trigger Emergency SOS and Send Live GPS Message"
                      >
                        <span>🚨</span>
                        <span>SOS</span>
                      </button>
                    </div>

                    {sosSent && (
                      <div className="p-3 bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold rounded-[14px] text-center animate-fade-in">
                        🚨 Emergency SOS broadcast dispatched to Bangalore safety response & platform admin!
                      </div>
                    )}
                  </div>

                  {/* Public Tracking Link */}
                  {trackingUrl && (
                    <div className="p-3 bg-[#F7F8F9] rounded-[14px] border border-[#EDF1F7] flex items-center justify-between text-xs">
                      <div className="flex-1 truncate mr-2">
                        <span className="text-[10px] text-[#8F9BB3] uppercase block font-bold">Public Share Trip Link</span>
                        <span className="text-[#0045FF] font-mono text-[11px] truncate block">{trackingUrl}</span>
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(trackingUrl);
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 2000);
                        }}
                        className="px-3 py-1.5 bg-white border border-[#E4E9F2] text-[#222B45] font-bold rounded-lg text-xs hover:bg-[#EBF3FF] transition"
                      >
                        {isCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  )}

                  {/* Cancel Button */}
                  {activeRide.status !== 'COMPLETED' && activeRide.status !== 'CANCELLED' && (
                    <button
                      type="button"
                      onClick={handleCancelRide}
                      className="w-full py-3 bg-[#F7F8F9] hover:bg-rose-50 hover:text-rose-700 text-[#8F9BB3] font-bold rounded-[14px] text-xs border border-[#EDF1F7] transition"
                    >
                      Cancel Ride Request
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Map (Active Real-Time Moving Vehicle Tracking) */}
            <div className="lg:col-span-7 flex flex-col h-[520px] lg:h-[640px] bg-white rounded-[24px] shadow-sm border border-[#EDF1F7] overflow-hidden">
              <div className="p-3.5 bg-[#F7F8F9] border-b border-[#EDF1F7] flex items-center justify-between">
                <span className="text-xs font-bold text-[#222B45] flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>
                    Active Trip Telemetry • {activeRide ? activeRide.status : 'Awaiting Trip'}
                  </span>
                </span>
                <span className="text-[11px] text-[#0045FF] font-bold">
                  {(driverLiveLocation as any)?.progress
                    ? `En Route • ${(driverLiveLocation as any).progress}%`
                    : 'Real-Time GPS'}
                </span>
              </div>
              <div className="flex-1 relative">
                <Map
                  pickup={activeRide?.pickup || (activeRide as any)?.pickupLocation || pickup}
                  dropoff={activeRide?.dropoff || (activeRide as any)?.dropoffLocation || dropoff}
                  driverLocation={
                    driverLiveLocation
                      ? {
                          latitude: driverLiveLocation.latitude,
                          longitude: driverLiveLocation.longitude,
                          progress: (driverLiveLocation as any).progress,
                          speedKmH: (driverLiveLocation as any).speedKmH
                        }
                      : null
                  }
                  followDriver={true}
                  height="100%"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RIDE HISTORY (Figma Screen: Ride history) */}
        {activeTab === 'history' && (
          <div className="max-w-3xl mx-auto bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-[#EDF1F7] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EDF1F7]">
              <div>
                <h3 className="text-base font-bold text-[#222B45]">Past Ride History</h3>
                <p className="text-xs text-[#8F9BB3]">Your completed trips and digital receipts.</p>
              </div>
              <span className="text-xs font-bold text-[#0045FF] bg-[#EBF3FF] px-2.5 py-1 rounded-full">
                {myRides.length} Trips
              </span>
            </div>

            <div className="divide-y divide-[#EDF1F7]">
              {(myRides.length > 0
                ? myRides.map((r) => ({
                    id: r.id,
                    date: new Date(r.createdAt || Date.now()).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }),
                    from: (r.pickup?.address || r.pickupLocation?.address || 'Pickup location').split(',')[0],
                    to: (r.dropoff?.address || r.dropoffLocation?.address || 'Destination').split(',')[0],
                    vehicle: r.vehicleCategory || r.rideType || 'Sedan',
                    amount: r.fare?.total ?? 145,
                    status: r.status
                  }))
                : [
                    {
                      id: 'ride-seed-01',
                      date: 'Today, 10:15 AM',
                      from: 'Koramangala 5th Block',
                      to: 'Indiranagar 100ft Rd',
                      vehicle: 'Sedan',
                      amount: 320,
                      status: 'COMPLETED'
                    },
                    {
                      id: 'ride-seed-02',
                      date: 'Yesterday, 6:30 PM',
                      from: 'MG Road CBD',
                      to: 'Whitefield Tech Park',
                      vehicle: 'Auto',
                      amount: 210,
                      status: 'COMPLETED'
                    }
                  ]
              ).map((r) => (
                <div key={r.id} className="py-4 flex items-center justify-between hover:bg-[#F7F8F9] px-3 rounded-[16px] transition">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-[12px] bg-[#EBF3FF] text-[#0045FF] flex items-center justify-center text-lg">
                      🚕
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#222B45]">{r.from} ➔ {r.to}</div>
                      <div className="text-[11px] text-[#8F9BB3]">{r.date} • {r.vehicle}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-[#222B45]">₹{r.amount}</div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {r.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: WALLET (Figma Screens: Payment options, Add card) */}
        {activeTab === 'wallet' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {topUpSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[16px] text-xs font-bold text-center animate-fade-in shadow-xs">
                {topUpSuccess}
              </div>
            )}

            {/* FIGMA WALLET PASS CARD: Electric Cobalt Blue #0045FF */}
            <div className="bg-gradient-to-tr from-[#0B132B] via-[#0045FF] to-[#1152FD] rounded-[24px] p-7 text-white shadow-xl space-y-4 border border-blue-400/30 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-[12px] bg-white text-[#0045FF] flex items-center justify-center font-black text-sm shadow-md">
                    RX
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-200 block">
                      RideX Platinum Digital Wallet
                    </span>
                    <span className="text-[10px] text-blue-100 font-mono">ID: RX-W-{(user?.id || '8842').slice(-6)}</span>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/15 text-white font-semibold border border-white/25 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Insured & Protected</span>
                </span>
              </div>

              <div className="relative z-10 py-2">
                <span className="text-xs text-blue-100 font-medium block mb-1">Available Spending Balance</span>
                <div className="text-5xl font-black tracking-tight text-white flex items-baseline space-x-2">
                  <span>₹{walletBalance.toFixed(2)}</span>
                  <span className="text-xs font-bold text-blue-200">INR</span>
                </div>
              </div>

              <div className="relative z-10 pt-2 border-t border-white/20 flex flex-wrap items-center justify-between text-xs text-blue-100">
                <div>
                  <span className="text-[10px] text-blue-200 uppercase block">Account Holder</span>
                  <span className="font-bold text-white">{user?.name || 'Verified Rider'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenGatewayForTopUp(500)}
                  className="mt-2 sm:mt-0 px-4 py-2 bg-white hover:bg-blue-50 text-[#0045FF] font-bold text-xs rounded-[12px] shadow-md transition flex items-center space-x-1.5"
                >
                  <span>⚡ Razorpay Instant Recharge</span>
                  <span>➔</span>
                </button>
              </div>
            </div>

            {/* FIGMA ADD CARD PREVIEW (Dark Charcoal #3E4958 Card) */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#EDF1F7] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#EDF1F7]">
                <h4 className="text-sm font-bold text-[#222B45]">
                  Linked Cards & Payment Methods (Figma Add Card)
                </h4>
                <span className="text-xs font-bold text-[#0045FF]">RBI Tokenized</span>
              </div>

              {/* 3D Dark Charcoal Card Visualizer */}
              <div className="w-full max-w-sm mx-auto bg-[#3E4958] rounded-[20px] p-5 text-white shadow-xl relative overflow-hidden border border-slate-600">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-xs font-mono font-bold tracking-widest text-slate-300">
                    RideX Virtual Card
                  </span>
                  <span className="text-xs font-black text-amber-400">Mastercard</span>
                </div>
                <div className="text-lg font-mono font-bold tracking-widest mb-4">
                  •••• •••• •••• 8842
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-300">
                  <div>
                    <span className="uppercase text-[8px] block text-slate-400">Card Holder</span>
                    <span className="font-bold text-white">{user?.name || 'ANANYA SHARMA'}</span>
                  </div>
                  <div>
                    <span className="uppercase text-[8px] block text-slate-400">Expires</span>
                    <span className="font-bold text-white">12/28</span>
                  </div>
                </div>
              </div>

              {/* Custom Top-Up Launchpad */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-[#4B545A] block">Top-Up Wallet via Gateway:</span>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-2.5 text-[#8F9BB3] font-bold text-sm">₹</span>
                    <input
                      type="number"
                      min="10"
                      max="50000"
                      value={customTopUpAmt}
                      onChange={(e) => setCustomTopUpAmt(e.target.value)}
                      placeholder="Enter recharge amount"
                      className="w-full pl-8 pr-4 py-2.5 text-xs font-bold border border-[#E4E9F2] rounded-[14px] bg-[#F7F8F9] focus:bg-white focus:border-[#0045FF] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const amt = Number(customTopUpAmt);
                      if (amt > 0) handleOpenGatewayForTopUp(amt);
                    }}
                    className="px-5 py-2.5 bg-[#0045FF] hover:bg-[#0038D1] text-white font-bold text-xs rounded-[14px] shadow-md transition flex items-center space-x-1.5"
                  >
                    <span>⚡ Razorpay Checkout</span>
                    <span>➔</span>
                  </button>
                </div>

                {/* Quick Chips */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[200, 500, 1000, 2000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleOpenGatewayForTopUp(amt)}
                      className="py-2 bg-[#F7F8F9] hover:bg-[#EBF3FF] hover:text-[#0045FF] text-[#4B545A] border border-[#EDF1F7] rounded-[12px] font-bold text-xs transition"
                    >
                      + ₹{amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* REAL-TIME WALLET TRANSACTION AUDIT LEDGER */}
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-[#EDF1F7] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EDF1F7]">
                <h4 className="text-sm font-bold text-[#222B45]">
                  Wallet Transaction Ledger
                </h4>
                <span className="text-[11px] text-[#8F9BB3] font-mono">
                  {walletTransactions.length} Recorded Entries
                </span>
              </div>

              {walletTransactions.length === 0 ? (
                <div className="text-center py-8 text-[#8F9BB3] space-y-1">
                  <div className="text-3xl">💳</div>
                  <div className="text-xs font-semibold">No transactions recorded yet</div>
                </div>
              ) : (
                <div className="divide-y divide-[#EDF1F7]">
                  {walletTransactions.map((tx: any) => {
                    const isCredit = tx.type === 'CREDIT';
                    return (
                      <div key={tx.id} className="py-3 flex items-center justify-between hover:bg-[#F7F8F9] px-2 rounded-xl transition">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                              isCredit
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {isCredit ? '↓' : '↑'}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-[#222B45]">
                              {tx.description || (isCredit ? 'Wallet Top-up' : 'Ride Settlement')}
                            </div>
                            <div className="text-[10px] text-[#8F9BB3] font-mono">
                              {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className={`text-xs font-black font-mono ${
                              isCredit ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {isCredit ? '+' : '-'} ₹{Number(tx.amount).toFixed(2)}
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                              isCredit ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                            }`}
                          >
                            {tx.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: SAVED PLACES */}
        {activeTab === 'places' && (
          <div className="max-w-2xl mx-auto bg-white rounded-[24px] p-6 sm:p-8 shadow-sm border border-[#EDF1F7] space-y-4">
            <h3 className="text-base font-bold text-[#222B45]">Saved Places</h3>
            <div className="space-y-2.5">
              {[
                { name: 'Home', address: 'Apartment 402, Indiranagar, Bangalore', icon: '🏠' },
                { name: 'Work / Office', address: 'Tech Park Tower 3, Whitefield, Bangalore', icon: '💼' },
                { name: 'Gym / Fitness', address: 'FitPro Gym, Koramangala, Bangalore', icon: '🏋️' }
              ].map((p) => (
                <div key={p.name} className="p-3.5 border border-[#EDF1F7] rounded-[16px] flex items-center justify-between hover:bg-[#F7F8F9] transition">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{p.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-[#222B45]">{p.name}</div>
                      <div className="text-[11px] text-[#8F9BB3]">{p.address}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setDropoff({ latitude: 12.9784, longitude: 77.6408, address: p.address });
                      setActiveTab('book');
                    }}
                    className="px-3 py-1.5 bg-[#EBF3FF] text-[#0045FF] text-xs font-bold rounded-[10px] hover:bg-blue-100 transition"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* FIGMA POST-TRIP RATING MODAL: Ride summary & Feedback */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 bg-[#3E4958]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-sm w-full p-6 space-y-4 shadow-2xl text-center border border-[#EDF1F7]">
            <span className="text-4xl">🎉</span>
            <h3 className="text-lg font-black text-[#222B45]">Your Trip Has Ended!</h3>
            <p className="text-xs text-[#8F9BB3]">
              How was your experience with driver Manoj Kumar? Rate to keep our community safe.
            </p>

            <div className="flex justify-center space-x-2 text-3xl cursor-pointer">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRatingScore(star)}
                  className={star <= ratingScore ? 'text-amber-400' : 'text-slate-200'}
                >
                  ★
                </span>
              ))}
            </div>

            {/* Tip Selection Pills */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-[#8F9BB3] uppercase block">Add Driver Tip</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 20, 50, 100].map((tip) => (
                  <button
                    key={tip}
                    type="button"
                    onClick={() => setSelectedTip(tip)}
                    className={`py-1.5 text-xs font-bold rounded-[10px] border transition ${
                      selectedTip === tip
                        ? 'bg-[#EBF3FF] border-[#0045FF] text-[#0045FF]'
                        : 'bg-[#F7F8F9] border-[#EDF1F7] text-[#4B545A]'
                    }`}
                  >
                    {tip === 0 ? 'None' : `+₹${tip}`}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Leave friendly feedback (e.g. Great driving and polite demeanor)..."
              className="w-full text-xs p-3 border border-[#E4E9F2] rounded-[14px] bg-[#F7F8F9] focus:bg-white focus:outline-none focus:border-[#0045FF]"
              rows={2}
            />

            <button
              onClick={handleSubmitRating}
              className="w-full h-12 bg-[#0045FF] hover:bg-[#0038D1] text-white font-bold rounded-[14px] text-xs transition shadow-md shadow-blue-500/25"
            >
              Submit Rating & Done
            </button>
          </div>
        </div>
      )}

      {/* PAYMENT GATEWAY MODAL */}
      <PaymentGatewayModal
        isOpen={showPaymentGateway}
        onClose={() => setShowPaymentGateway(false)}
        onSuccess={handleGatewaySuccess}
        amount={gatewayAmount}
        title={gatewayTitle}
        customerName={user?.name || 'RideX Customer'}
        customerEmail={user?.email || 'rider@ridex.com'}
        currentWalletBalance={walletBalance}
        mode={gatewayMode}
      />

      {/* REAL-TIME IN-APP CHAT MODAL */}
      {activeRide && (
        <RideChatModal
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          rideId={activeRide.id}
          recipientName={activeRide.driverName || 'Manoj Reddy'}
          recipientRole="DRIVER"
          recipientVehiclePlate={activeRide.vehicle?.plateNumber || 'KA-04-SD-4444'}
        />
      )}

      {/* REAL-TIME DIRECT CELLULAR CALL MODAL */}
      {activeRide && (
        <RideCallModal
          isOpen={showCallModal}
          onClose={() => setShowCallModal(false)}
          rideId={activeRide.id}
          recipientName={activeRide.driverName || 'Manoj Reddy'}
          recipientRole="DRIVER"
          recipientPhone={activeRide.driverPhone || '+919876500024'}
          recipientVehiclePlate={activeRide.vehicle?.plateNumber || 'KA-04-SD-4444'}
        />
      )}

      {/* EMERGENCY CONTACTS MANAGEMENT MODAL */}
      <EmergencyContactsModal
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
        contacts={emergencyContacts}
        onAddContact={handleAddEmergencyContact}
        onDeleteContact={handleDeleteEmergencyContact}
        onTriggerSosWithMessage={handleSos}
      />

      {/* SOS EMERGENCY ALERT DISPATCHED MODAL */}
      <SosAlertModal
        isOpen={showSosModal}
        onClose={() => setShowSosModal(false)}
        contacts={emergencyContacts}
        tripId={activeRide?.id}
        latitude={driverLiveLocation?.latitude || pickup.latitude || 12.9716}
        longitude={driverLiveLocation?.longitude || pickup.longitude || 77.5946}
        locationLink={
          activeRide?.trackingToken
            ? `${window.location.origin}/track/${activeRide.trackingToken}`
            : `https://maps.google.com/?q=${driverLiveLocation?.latitude || pickup.latitude || 12.9716},${driverLiveLocation?.longitude || pickup.longitude || 77.5946}`
        }
      />
    </div>
  );
};
