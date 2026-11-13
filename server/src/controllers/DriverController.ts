import { Request, Response, NextFunction } from 'express';
import { DriverService } from '../services/DriverService';
import { UnauthorizedError } from '../errors';

/** OOP: Abstraction
 *  WHY: Thin REST adapter for driver actions (status changes, request browsing, ride lifecycle steps, earnings inspection). */
export class DriverController {
  private readonly _driverService: DriverService;

  constructor(driverService: DriverService) {
    this._driverService = driverService;
  }

  public setStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { status } = req.body;
      const result = this._driverService.setStatus(req.user.getId(), status);
      res.status(200).json({
        status: 'SUCCESS',
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  public getRequests = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requests = this._driverService.getAvailableRequests();
      res.status(200).json({
        status: 'SUCCESS',
        data: requests.map((r) => r.toJSON())
      });
    } catch (err) {
      next(err);
    }
  };

  public acceptRide = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const id = req.params.id as string;
      const ride = this._driverService.acceptRide(req.user.getId(), id);
      res.status(200).json({
        status: 'SUCCESS',
        data: ride.toJSON()
      });
    } catch (err) {
      next(err);
    }
  };

  public arriveAtPickup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const id = req.params.id as string;
      const ride = this._driverService.arriveAtPickup(req.user.getId(), id);
      res.status(200).json({
        status: 'SUCCESS',
        data: ride.toJSON()
      });
    } catch (err) {
      next(err);
    }
  };

  public startTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const id = req.params.id as string;
      const { otp } = req.body;
      const ride = this._driverService.startTrip(req.user.getId(), id, otp);
      res.status(200).json({
        status: 'SUCCESS',
        data: ride.toJSON()
      });
    } catch (err) {
      next(err);
    }
  };

  public completeTrip = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const id = req.params.id as string;
      const ride = await this._driverService.completeTrip(req.user.getId(), id);
      res.status(200).json({
        status: 'SUCCESS',
        data: ride.toJSON()
      });
    } catch (err) {
      next(err);
    }
  };

  public getEarnings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const earnings = this._driverService.getEarnings(req.user.getId());
      res.status(200).json({
        status: 'SUCCESS',
        data: earnings
      });
    } catch (err) {
      next(err);
    }
  };

  public updateLocation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { latitude, longitude, address } = req.body;
      const loc = this._driverService.updateLocation(
        req.user.getId(),
        Number(latitude),
        Number(longitude),
        address
      );
      res.status(200).json({
        status: 'SUCCESS',
        data: loc
      });
    } catch (err) {
      next(err);
    }
  };
}
