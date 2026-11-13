import bcrypt from 'bcryptjs';
import { initDatabase } from './database';
import { UserRepository } from '../repositories/UserRepository';
import { VehicleRepository } from '../repositories/VehicleRepository';
import { RideRepository } from '../repositories/RideRepository';
import { RatingRepository } from '../repositories/RatingRepository';
import { PromoCodeRepository } from '../repositories/PromoCodeRepository';
import { UserFactory } from '../domain/UserFactory';
import { PromoCode } from '../domain/promo/PromoCode';
import { StandardRide } from '../domain/rides/StandardRide';
import { SharedRide } from '../domain/rides/SharedRide';
import { Customer } from '../domain/Customer';
import { Driver } from '../domain/Driver';
import { StandardPricing } from '../domain/pricing/StandardPricing';

export function runSeed(): void {
  console.log('🌱 Starting RideX Database Seeding...');

  const db = initDatabase();
  const vehicleRepo = new VehicleRepository(db);
  const ratingRepo = new RatingRepository(db);
  const userRepo = new UserRepository(db, undefined, vehicleRepo, ratingRepo);
  const rideRepo = new RideRepository(db, userRepo, vehicleRepo);
  const promoRepo = new PromoCodeRepository(db);

  const hashPassword = (plain: string) => bcrypt.hashSync(plain, bcrypt.genSaltSync(10));

  // 1. Seed 1 Admin
  const admin = UserFactory.createUser({
    id: 'admin-01',
    name: 'Sarah Connor',
    email: 'admin@ridex.com',
    passwordHash: hashPassword('admin123'),
    phone: '+919876500001',
    role: 'ADMIN',
    department: 'Global Safety & Operations'
  });
  userRepo.save(admin);
  console.log('✅ Seeded 1 Admin: admin@ridex.com (pw: admin123)');

  // 2. Seed 5 Customers
  const customerConfigs = [
    { id: 'cust-01', name: 'Ananya Sharma', email: 'ananya@ridex.com', phone: '+919876500011', balance: 1500 },
    { id: 'cust-02', name: 'Rahul Verma', email: 'rahul@ridex.com', phone: '+919876500012', balance: 2000 },
    { id: 'cust-03', name: 'Priya Patel', email: 'priya@ridex.com', phone: '+919876500013', balance: 1000 },
    { id: 'cust-04', name: 'Amit Kumar', email: 'amit@ridex.com', phone: '+919876500014', balance: 800 },
    { id: 'cust-05', name: 'Sneha Rao', email: 'sneha@ridex.com', phone: '+919876500015', balance: 2500 }
  ];

  const customers: Customer[] = [];
  for (const c of customerConfigs) {
    const cust = UserFactory.createUser({
      id: c.id,
      name: c.name,
      email: c.email,
      passwordHash: hashPassword('cust123'),
      phone: c.phone,
      role: 'CUSTOMER',
      initialWalletBalance: c.balance
    }) as Customer;

    cust.addSavedPlace({
      id: `sp-${c.id}-1`,
      name: 'Home',
      latitude: 12.9716,
      longitude: 77.5946,
      address: 'MG Road, Bengaluru'
    });
    userRepo.save(cust);
    customers.push(cust);
  }
  console.log('✅ Seeded 5 Customers: ananya@ridex.com .. sneha@ridex.com (pw: cust123)');

  // 3. Seed 5 Drivers with different vehicle types
  const driverConfigs = [
    {
      id: 'drv-01',
      name: 'Vikram Singh (Bike)',
      email: 'vikram.bike@ridex.com',
      phone: '+919876500021',
      license: 'DL-KA-BIKE-101',
      vehicleType: 'BIKE' as const,
      plate: 'KA-01-BK-1111',
      model: 'Yamaha FZ',
      color: 'Matte Black',
      lat: 12.972,
      lng: 77.595
    },
    {
      id: 'drv-02',
      name: 'Rajesh G (Auto)',
      email: 'rajesh.auto@ridex.com',
      phone: '+919876500022',
      license: 'DL-KA-AUTO-202',
      vehicleType: 'AUTO' as const,
      plate: 'KA-02-AT-2222',
      model: 'Bajaj Compact',
      color: 'Yellow-Green',
      lat: 12.935,
      lng: 77.624
    },
    {
      id: 'drv-03',
      name: 'Suresh Kumar (Mini)',
      email: 'suresh.mini@ridex.com',
      phone: '+919876500023',
      license: 'DL-KA-MINI-303',
      vehicleType: 'MINI' as const,
      plate: 'KA-03-MN-3333',
      model: 'Maruti Swift',
      color: 'Silver',
      lat: 12.927,
      lng: 77.684
    },
    {
      id: 'drv-04',
      name: 'Manoj Reddy (Sedan)',
      email: 'manoj.sedan@ridex.com',
      phone: '+919876500024',
      license: 'DL-KA-SEDAN-404',
      vehicleType: 'SEDAN' as const,
      plate: 'KA-04-SD-4444',
      model: 'Honda City',
      color: 'Pure White',
      lat: 12.978,
      lng: 77.64
    },
    {
      id: 'drv-05',
      name: 'Karan Malhotra (SUV)',
      email: 'karan.suv@ridex.com',
      phone: '+919876500025',
      license: 'DL-KA-SUV-505',
      vehicleType: 'SUV' as const,
      plate: 'KA-05-SV-5555',
      model: 'Toyota Fortuner',
      color: 'Obsidian Black',
      lat: 13.035,
      lng: 77.597
    }
  ];

  const drivers: Driver[] = [];
  for (const d of driverConfigs) {
    const driver = UserFactory.createUser({
      id: d.id,
      name: d.name,
      email: d.email,
      passwordHash: hashPassword('driver123'),
      phone: d.phone,
      role: 'DRIVER',
      licenseNumber: d.license,
      vehicleType: d.vehicleType,
      plateNumber: d.plate,
      vehicleModel: d.model,
      vehicleColor: d.color
    }) as Driver;

    driver.updateLocation(d.lat, d.lng, 'Central Bengaluru');
    driver.goOnline();
    userRepo.save(driver);
    drivers.push(driver);
  }
  console.log('✅ Seeded 5 Drivers with distinct vehicle types (Bike, Auto, Mini, Sedan, SUV)');

  // 4. Seed Promo Codes
  const promo1 = new PromoCode('promo-01', 'WELCOME50', 50, 100.0, 50.0);
  const promo2 = new PromoCode('promo-02', 'RIDEX20', 20, 50.0, 30.0);
  promoRepo.save(promo1);
  promoRepo.save(promo2);
  console.log('✅ Seeded Promo Codes: WELCOME50, RIDEX20');

  // 5. Seed a few completed rides and 1 active requested ride
  const pricing = new StandardPricing();

  // Completed Ride 1: Ananya with Manoj (Sedan)
  const ride1 = new StandardRide(
    'ride-seed-01',
    customers[0],
    drivers[3].getVehicle()!,
    { latitude: 12.9716, longitude: 77.5946, address: 'MG Road' },
    { latitude: 12.9352, longitude: 77.6245, address: 'Koramangala' },
    8.5,
    22
  );
  ride1.accept(drivers[3]);
  ride1.arrive();
  ride1.start();
  ride1.complete(pricing);
  rideRepo.save(ride1);

  // Rate ride 1
  customers[0].rateDriver(drivers[3], 5, 'Super clean sedan, smooth driving!');
  userRepo.save(drivers[3]);
  ratingRepo.save({
    id: 'rat-seed-01',
    rideId: ride1.getId(),
    customerId: customers[0].getId(),
    driverId: drivers[3].getId(),
    score: 5,
    comment: 'Super clean sedan, smooth driving!',
    createdAt: new Date()
  });

  // Completed Ride 2: Rahul with Vikram (Bike)
  const ride2 = new StandardRide(
    'ride-seed-02',
    customers[1],
    drivers[0].getVehicle()!,
    { latitude: 12.9716, longitude: 77.5946, address: 'Indiranagar' },
    { latitude: 12.9279, longitude: 77.6845, address: 'Bellandur' },
    11.0,
    25
  );
  ride2.accept(drivers[0]);
  ride2.arrive();
  ride2.start();
  ride2.complete(pricing);
  rideRepo.save(ride2);

  // Rate ride 2
  customers[1].rateDriver(drivers[0], 4, 'Fast and beat the traffic!');
  userRepo.save(drivers[0]);
  ratingRepo.save({
    id: 'rat-seed-02',
    rideId: ride2.getId(),
    customerId: customers[1].getId(),
    driverId: drivers[0].getId(),
    score: 4,
    comment: 'Fast and beat the traffic!',
    createdAt: new Date()
  });

  // Active Requested Ride 3: Sneha waiting for dispatch
  const ride3 = new SharedRide(
    'ride-seed-03',
    customers[4],
    drivers[1].getVehicle()!,
    { latitude: 12.978, longitude: 77.64, address: 'Domlur' },
    { latitude: 12.935, longitude: 77.624, address: 'Koramangala Sony Signal' },
    5.0,
    15,
    2
  );
  ride3.calculateFare(pricing);
  rideRepo.save(ride3);

  console.log('✅ Seeded 3 sample rides (2 Completed with 5-star ratings, 1 Requested)');
  console.log('🎉 Database seeding completed successfully!\n');
}

if (require.main === module) {
  try {
    runSeed();
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}
