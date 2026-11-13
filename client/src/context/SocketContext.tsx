import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useOOP } from './OOPContext';
import { Location, ChatMessage, CallState } from '../types';

export interface RideOffer {
  rideId: string;
  customerId: string;
  pickup: Location;
  dropoff: Location;
  vehicleCategory: string;
  rideType: string;
  distanceKm: number;
  durationMin: number;
  estimatedFare: number;
  expiresInSeconds: number;
}

export interface RideStatusUpdate {
  rideId: string;
  status: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverRating?: number;
  vehiclePlate?: string;
  vehicleModel?: string;
  vehicleColor?: string;
  vehicleCategory?: string;
  otp?: string;
  trackingToken?: string;
  cancellationFee?: number;
  completedAt?: string;
}

export interface DriverLocationUpdate {
  driverId: string;
  latitude: number;
  longitude: number;
  address?: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  incomingOffer: RideOffer | null;
  activeStatusUpdate: RideStatusUpdate | null;
  driverLiveLocation: DriverLocationUpdate | null;
  chatMessages: ChatMessage[];
  activeCall: CallState | null;
  clearIncomingOffer: () => void;
  clearStatusUpdate: () => void;
  joinRideRoom: (rideId: string) => void;
  joinDriverRoom: (driverId: string) => void;
  joinTrackingRoom: (token: string) => void;
  requestDispatch: (rideId: string) => void;
  startSimulation: (rideId: string) => void;
  triggerSos: (rideId: string, reason?: string) => void;
  sendChatMessage: (rideId: string, message: string) => void;
  startCall: (rideId: string) => void;
  acceptCall: (rideId: string) => void;
  endCall: (rideId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [incomingOffer, setIncomingOffer] = useState<RideOffer | null>(null);
  const [activeStatusUpdate, setActiveStatusUpdate] = useState<RideStatusUpdate | null>(null);
  const [driverLiveLocation, setDriverLiveLocation] = useState<DriverLocationUpdate | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activeCall, setActiveCall] = useState<CallState | null>(null);

  const { user } = useAuth();
  const { logOOPEvent } = useOOP();

  useEffect(() => {
    // Establish Socket.IO connection
    const newSocket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('⚡ Socket.IO connected with id:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('⚡ Socket.IO disconnected');
    });

    newSocket.on('ride:offer', (offer: RideOffer) => {
      console.log('🔔 Received ride offer:', offer);
      setIncomingOffer(offer);
      logOOPEvent(
        'Polymorphism',
        'Dispatch Matching Strategy Matched Driver',
        `IMatchingStrategy selected this driver based on runtime scoring algorithm. Offer valid for 15 seconds.`,
        `strategy.findDriver(request, availableDrivers);\n// Matched offer delivered to driver:${user?.id}`
      );
    });

    newSocket.on('ride:statusChanged', (update: RideStatusUpdate) => {
      console.log('🔄 Ride status transition:', update);
      setActiveStatusUpdate(update);
      logOOPEvent(
        'Encapsulation',
        `Ride State Machine Transition -> ${update.status}`,
        `Ride._state transitioned to ${update.status}. Protected setState() validated legal finite state machine transitions.`,
        `protected setState(nextState: RideStatus) {\n  if (!legalTransitions.includes(nextState)) throw new IllegalStateError();\n  this._state = nextState;\n}`
      );
    });

    newSocket.on('ride:accepted', (update: RideStatusUpdate) => {
      console.log('✅ Ride accepted by driver:', update);
      setActiveStatusUpdate(update);
    });

    newSocket.on('driver:location', (loc: DriverLocationUpdate) => {
      setDriverLiveLocation(loc);
    });

    newSocket.on('driver_moved', (loc: { driverId: string; lat: number; lng: number }) => {
      setDriverLiveLocation({
        driverId: loc.driverId,
        latitude: loc.lat,
        longitude: loc.lng
      });
    });

    // Real-time Chat listener
    newSocket.on('ride:chat_message', (msg: ChatMessage) => {
      console.log('💬 Received chat message:', msg);
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Real-time Calling listeners
    newSocket.on('ride:incoming_call', (call: CallState) => {
      console.log('📞 Incoming in-app call:', call);
      setActiveCall({
        ...call,
        status: 'RINGING'
      });
    });

    newSocket.on('ride:call_accepted', () => {
      console.log('📞 In-app call connected');
      setActiveCall((prev) => (prev ? { ...prev, status: 'CONNECTED' } : null));
    });

    newSocket.on('ride:call_ended', () => {
      console.log('📞 In-app call terminated');
      setActiveCall((prev) => (prev ? { ...prev, status: 'ENDED' } : null));
      setTimeout(() => setActiveCall(null), 1200);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Automatically join driver room if logged in as driver
  useEffect(() => {
    if (socket && user && user.role === 'DRIVER') {
      socket.emit('join_driver', user.id);
    }
  }, [socket, user]);

  const joinRideRoom = (rideId: string) => {
    socket?.emit('join_ride', rideId);
  };

  const joinDriverRoom = (driverId: string) => {
    socket?.emit('join_driver', driverId);
  };

  const joinTrackingRoom = (token: string) => {
    socket?.emit('join_track', token);
  };

  const requestDispatch = (rideId: string) => {
    socket?.emit('ride:request_dispatch', rideId);
  };

  const startSimulation = (rideId: string) => {
    socket?.emit('driver:start_simulation', rideId);
  };

  const triggerSos = (rideId: string, reason: string = 'Passenger emergency panic button pressed') => {
    if (!user) return;
    socket?.emit('sos:trigger', {
      rideId,
      triggeredBy: `${user.name} (${user.role})`,
      reason
    });
    logOOPEvent(
      'Encapsulation',
      'SOS Safety Alert Dispatched',
      `Distress signal recorded with immutable timestamp and escalated to administrator dashboard.`,
      `dispatchService.triggerSos(rideId, "${user.name}", "${reason}");`
    );
  };

  const sendChatMessage = (rideId: string, message: string) => {
    if (!socket || !user || !message.trim()) return;
    const role = user.role === 'DRIVER' ? 'DRIVER' : 'CUSTOMER';
    socket.emit('ride:send_chat', {
      rideId,
      senderId: user.id,
      senderName: user.name,
      senderRole: role,
      message: message.trim()
    });
  };

  const startCall = (rideId: string) => {
    if (!socket || !user) return;
    const role = user.role === 'DRIVER' ? 'DRIVER' : 'CUSTOMER';
    const newCall: CallState = {
      rideId,
      callerId: user.id,
      callerName: user.name,
      callerRole: role,
      status: 'RINGING',
      timestamp: new Date().toISOString()
    };
    setActiveCall(newCall);
    socket.emit('ride:start_call', newCall);
  };

  const acceptCall = (rideId: string) => {
    if (!socket) return;
    socket.emit('ride:accept_call', { rideId });
    setActiveCall((prev) => (prev ? { ...prev, status: 'CONNECTED' } : null));
  };

  const endCall = (rideId: string) => {
    if (!socket || !user) return;
    socket.emit('ride:end_call', {
      rideId,
      callerRole: user.role
    });
    setActiveCall((prev) => (prev ? { ...prev, status: 'ENDED' } : null));
    setTimeout(() => setActiveCall(null), 800);
  };

  const clearIncomingOffer = () => {
    setIncomingOffer(null);
  };

  const clearStatusUpdate = () => {
    setActiveStatusUpdate(null);
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        incomingOffer,
        activeStatusUpdate,
        driverLiveLocation,
        chatMessages,
        activeCall,
        clearIncomingOffer,
        clearStatusUpdate,
        joinRideRoom,
        joinDriverRoom,
        joinTrackingRoom,
        requestDispatch,
        startSimulation,
        triggerSos,
        sendChatMessage,
        startCall,
        acceptCall,
        endCall
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
