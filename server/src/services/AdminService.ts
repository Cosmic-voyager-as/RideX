import { IRepository } from '../repositories/IRepository';
import { User } from '../domain/User';
import { Ride } from '../domain/rides/Ride';
import { UserRepository } from '../repositories/UserRepository';
import { NotFoundError } from '../errors';

/** OOP: Abstraction
 *  WHY: Implements system-level administration queries and operational overrides. */
export class AdminService {
  private readonly _userRepo: IRepository<User>;
  private readonly _rideRepo: IRepository<Ride>;

  constructor(userRepo: IRepository<User>, rideRepo: IRepository<Ride>) {
    this._userRepo = userRepo;
    this._rideRepo = rideRepo;
  }

  public getAllUsers() {
    return this._userRepo.findAll().map((u) => u.toPublicJSON());
  }

  public blockUser(userId: string, isBlocked: boolean = true) {
    const user = this._userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError(`User with ID ${userId} not found`);
    }

    if (this._userRepo instanceof UserRepository) {
      this._userRepo.blockUser(userId, isBlocked);
    }

    return {
      userId,
      isBlocked,
      message: `User ${userId} ${isBlocked ? 'blocked' : 'unblocked'} successfully`
    };
  }

  public getAllRides() {
    return this._rideRepo.findAll().map((r) => r.toJSON());
  }

  public getAnalytics() {
    const users = this._userRepo.findAll();
    const rides = this._rideRepo.findAll();

    const customers = users.filter((u) => u.getRole() === 'CUSTOMER');
    const drivers = users.filter((u) => u.getRole() === 'DRIVER');
    const admins = users.filter((u) => u.getRole() === 'ADMIN');
    const completedRides = rides.filter((r) => r.getStatus() === 'COMPLETED');
    const activeRides = rides.filter((r) =>
      ['REQUESTED', 'ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(r.getStatus())
    );
    const cancelledRides = rides.filter((r) => r.getStatus() === 'CANCELLED');

    const totalRevenue = completedRides.reduce((acc, r) => {
      const fare = r.getFare();
      return acc + (fare ? fare.total : 0);
    }, 0);
    const estimatedPlatformRevenue = Math.round(totalRevenue * 0.2 * 100) / 100;

    return {
      users: {
        total: users.length,
        customers: customers.length,
        drivers: drivers.length,
        admins: admins.length
      },
      rides: {
        total: rides.length,
        completed: completedRides.length,
        active: activeRides.length,
        cancelled: cancelledRides.length
      },
      financials: {
        totalPlatformGrossFare: Math.round(totalRevenue * 100) / 100,
        estimatedPlatformRevenue
      },
      summary: {
        totalUsers: users.length,
        totalCustomers: customers.length,
        totalDrivers: drivers.length,
        totalRides: rides.length,
        completedRides: completedRides.length,
        cancelledRides: cancelledRides.length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageFare:
          completedRides.length > 0
            ? Math.round((totalRevenue / completedRides.length) * 100) / 100
            : 0
      },
      timestamp: new Date().toISOString()
    };
  }
}

