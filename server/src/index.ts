import dotenv from 'dotenv';
import path from 'path';

// Load .env before any modules initialize
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import { initDatabase } from './db/database';
import { UserRepository } from './repositories/UserRepository';
import { RideRepository } from './repositories/RideRepository';
import { VehicleRepository } from './repositories/VehicleRepository';
import { RatingRepository } from './repositories/RatingRepository';
import { PromoCodeRepository } from './repositories/PromoCodeRepository';
import { AuthService } from './services/AuthService';
import { RideService } from './services/RideService';
import { CustomerService } from './services/CustomerService';
import { DriverService } from './services/DriverService';
import { AdminService } from './services/AdminService';
import { DispatchService } from './services/DispatchService';
import { RazorpayService } from './services/RazorpayService';
import { createAuthMiddleware } from './middleware/authMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { AuthController } from './controllers/AuthController';
import { RideController } from './controllers/RideController';
import { CustomerController } from './controllers/CustomerController';
import { DriverController } from './controllers/DriverController';
import { AdminController } from './controllers/AdminController';
import { PaymentController } from './controllers/PaymentController';
import { createAuthRouter } from './routes/authRoutes';
import { createRideRouter } from './routes/rideRoutes';
import { createCustomerRouter } from './routes/customerRoutes';
import { createDriverRouter } from './routes/driverRoutes';
import { createAdminRouter } from './routes/adminRoutes';
import { createPaymentRouter } from './routes/paymentRoutes';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  }
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// 1. Initialize SQLite Database
const db = initDatabase();

// 2. Instantiate Repositories (Abstraction & Dependency Inversion)
const vehicleRepo = new VehicleRepository(db);
const ratingRepo = new RatingRepository(db);
const userRepo = new UserRepository(db, undefined, vehicleRepo, ratingRepo);
const rideRepo = new RideRepository(db, userRepo, vehicleRepo);
const promoRepo = new PromoCodeRepository(db);

// 3. Instantiate Domain Services
const authService = new AuthService(userRepo);
const rideService = new RideService(userRepo, rideRepo, vehicleRepo, ratingRepo, promoRepo);
const customerService = new CustomerService(userRepo, promoRepo);
const dispatchService = new DispatchService(io, userRepo, rideRepo);
const driverService = new DriverService(
  userRepo,
  rideRepo,
  (ride, status, driver) => {
    dispatchService.broadcastRideStatusChanged(ride, status, driver);
    if (status === 'ACCEPTED' || status === 'IN_PROGRESS') {
      dispatchService.startGpsSimulation(ride);
    }
  }
);
const adminService = new AdminService(userRepo, rideRepo);
const razorpayService = new RazorpayService();

// 4. Instantiate Middleware
const { authenticate, authorize } = createAuthMiddleware(authService, userRepo);

// 5. Instantiate Controllers
const authController = new AuthController(authService);
const rideController = new RideController(rideService);
const customerController = new CustomerController(customerService);
const driverController = new DriverController(driverService);
const adminController = new AdminController(adminService, dispatchService);
const paymentController = new PaymentController(razorpayService, userRepo);

// 6. Mount REST API Routers
app.use('/api/auth', createAuthRouter(authController, authenticate));
app.use('/api/rides', createRideRouter(rideController, authenticate, authorize));
app.use('/api/customer', createCustomerRouter(customerController, authenticate, authorize));
app.use('/api/driver', createDriverRouter(driverController, authenticate, authorize));
app.use('/api/admin', createAdminRouter(adminController, authenticate, authorize));
app.use('/api/payment', createPaymentRouter(paymentController, authenticate));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'RideX Backend API',
    timestamp: new Date().toISOString()
  });
});

// OOP Architecture introspection endpoint
app.get('/api/oop-overview', (_req: Request, res: Response) => {
  res.json({
    title: 'RideX OOP Core Architecture',
    principles: {
      encapsulation: 'Private/protected state with validated getters and mutations (Wallet balance, User password, Ride FSM transitions).',
      inheritance: 'Real is-a hierarchies (User -> Customer, Driver, Admin; Vehicle -> Bike..Premium; Ride -> Standard..Outstation).',
      abstraction: 'Contracts (IRepository<T>, IPricingStrategy, IPaymentMethod) isolating callers from concrete data structures.',
      polymorphism: 'Runtime dynamic dispatch without switch-on-type (Fare calculation, payment execution, error mapping, role authorization).'
    }
  });
});

// 7. Centralized Error Handler (Polymorphism: AppError statusCode dispatch)
app.use(errorHandler);

// Real-time Socket.IO dispatch
io.on('connection', (socket) => {
  socket.on('join_ride', (rideId: string) => {
    socket.join(`ride:${rideId}`);
  });

  socket.on('join_driver', (driverId: string) => {
    socket.join(`driver:${driverId}`);
  });

  socket.on('join_track', (token: string) => {
    socket.join(`track:${token}`);
  });

  socket.on('ride:request_dispatch', (rideId: string) => {
    const ride = rideRepo.findById(rideId);
    if (ride) {
      dispatchService.dispatchRide(ride);
    }
  });

  socket.on('driver:start_simulation', (rideId: string) => {
    const ride = rideRepo.findById(rideId);
    if (ride) {
      dispatchService.startGpsSimulation(ride);
    }
  });

  socket.on('sos:trigger', (data: { rideId: string; triggeredBy: string; reason?: string }) => {
    dispatchService.triggerSos(data.rideId, data.triggeredBy, data.reason);
  });

  socket.on('driver_location_update', (data: { driverId: string; lat: number; lng: number }) => {
    io.emit('driver_moved', data);
  });

  // REAL-TIME IN-APP CHAT (Customer <-> Driver)
  socket.on('ride:send_chat', (data: {
    rideId: string;
    senderId: string;
    senderName: string;
    senderRole: 'CUSTOMER' | 'DRIVER';
    message: string;
  }) => {
    const chatMsg = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      rideId: data.rideId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      message: data.message,
      timestamp: new Date().toISOString()
    };

    io.to(`ride:${data.rideId}`).emit('ride:chat_message', chatMsg);

    // If sent by customer, simulate realistic driver response after 1.2s for single-tab interactive testing
    if (data.senderRole === 'CUSTOMER') {
      setTimeout(() => {
        const ride = rideRepo.findById(data.rideId);
        const driverName = ride?.getDriver()?.getName() || 'Manoj Reddy';
        const driverId = ride?.getDriver()?.getId() || 'drv-04';

        const autoReplies = [
          "On my way! Traffic is smooth, arriving in 2 minutes.",
          "I have arrived at the pickup location. Waiting outside in the white Sedan.",
          "Acknowledged! Please have your 4-digit PIN ready.",
          "Got your message, see you shortly!"
        ];
        const randomReply = autoReplies[Math.floor(Math.random() * autoReplies.length)];

        const driverReply = {
          id: `msg_${Date.now()}_drv`,
          rideId: data.rideId,
          senderId: driverId,
          senderName: driverName,
          senderRole: 'DRIVER' as const,
          message: randomReply,
          timestamp: new Date().toISOString()
        };
        io.to(`ride:${data.rideId}`).emit('ride:chat_message', driverReply);
      }, 1200);
    }
  });

  // REAL-TIME IN-APP CALLING (WebRTC / Voice Audio Signaling)
  socket.on('ride:start_call', (data: {
    rideId: string;
    callerId: string;
    callerName: string;
    callerRole: 'CUSTOMER' | 'DRIVER';
  }) => {
    io.to(`ride:${data.rideId}`).emit('ride:incoming_call', {
      ...data,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('ride:accept_call', (data: { rideId: string }) => {
    io.to(`ride:${data.rideId}`).emit('ride:call_accepted', data);
  });

  socket.on('ride:end_call', (data: { rideId: string; callerRole?: string }) => {
    io.to(`ride:${data.rideId}`).emit('ride:call_ended', data);
  });
});

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 RideX Server running on http://localhost:${PORT}`);
    console.log(`📡 Socket.IO server ready on port ${PORT}`);
  });
}

export {
  app,
  server,
  io,
  db,
  userRepo,
  rideRepo,
  vehicleRepo,
  ratingRepo,
  promoRepo,
  authService,
  rideService,
  customerService,
  driverService,
  adminService,
  dispatchService
};
