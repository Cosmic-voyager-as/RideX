import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/AdminService';
import { DispatchService } from '../services/DispatchService';
import { IMatchingStrategy } from '../domain/matching/IMatchingStrategy';
import { NearestDriverStrategy } from '../domain/matching/NearestDriverStrategy';
import { HighestRatedStrategy } from '../domain/matching/HighestRatedStrategy';
import { BalancedStrategy } from '../domain/matching/BalancedStrategy';

/** OOP: Abstraction
 *  WHY: Thin REST adapter for administrator supervision, user blocks, system audit logs, and analytics. */
export class AdminController {
  private readonly _adminService: AdminService;
  private readonly _dispatchService?: DispatchService;

  constructor(adminService: AdminService, dispatchService?: DispatchService) {
    this._adminService = adminService;
    this._dispatchService = dispatchService;
  }

  public getUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = this._adminService.getAllUsers();
      res.status(200).json({
        status: 'SUCCESS',
        data: users
      });
    } catch (err) {
      next(err);
    }
  };

  public blockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { isBlocked } = req.body;
      const result = this._adminService.blockUser(id, isBlocked !== false);
      res.status(200).json({
        status: 'SUCCESS',
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  public getRides = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rides = this._adminService.getAllRides();
      res.status(200).json({
        status: 'SUCCESS',
        data: rides
      });
    } catch (err) {
      next(err);
    }
  };

  public getAnalytics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const analytics = this._adminService.getAnalytics();
      res.status(200).json({
        status: 'SUCCESS',
        data: analytics
      });
    } catch (err) {
      next(err);
    }
  };

  public setMatchingStrategy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { strategy } = req.body;
      let matchingStrategy: IMatchingStrategy;
      switch (strategy) {
        case 'HIGHEST_RATED':
          matchingStrategy = new HighestRatedStrategy();
          break;
        case 'BALANCED':
          matchingStrategy = new BalancedStrategy();
          break;
        case 'NEAREST':
        default:
          matchingStrategy = new NearestDriverStrategy();
          break;
      }
      if (this._dispatchService) {
        this._dispatchService.setMatchingStrategy(matchingStrategy);
      }
      res.status(200).json({
        status: 'SUCCESS',
        data: {
          currentStrategy: matchingStrategy.getName(),
          message: `Dispatch matching strategy switched to ${matchingStrategy.getName()}`
        }
      });
    } catch (err) {
      next(err);
    }
  };

  public getSosAlerts = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const alerts = this._dispatchService ? this._dispatchService.getSosAlerts() : [];
      res.status(200).json({
        status: 'SUCCESS',
        data: alerts
      });
    } catch (err) {
      next(err);
    }
  };
}
