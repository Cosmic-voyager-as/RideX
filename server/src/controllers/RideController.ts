import { Request, Response, NextFunction } from 'express';
import { RideService } from '../services/RideService';
import { UnauthorizedError } from '../errors';

/** OOP: Abstraction
 *  WHY: Thin REST adapter for ride lifecycle actions, delegating estimation, booking, cancellation, and ratings directly to the RideService. */
export class RideController {
  private readonly _rideService: RideService;

  constructor(rideService: RideService) {
    this._rideService = rideService;
  }

  public estimate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { vehicleCategory, distanceKm, durationMin, promoCode } = req.body;
      const fare = this._rideService.estimateFare(
        vehicleCategory,
        Number(distanceKm),
        Number(durationMin),
        promoCode
      );

      res.status(200).json({
        status: 'SUCCESS',
        data: fare.toJSON()
      });
    } catch (err) {
      next(err);
    }
  };

  public book = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();

      const ride = this._rideService.bookRide({
        ...req.body,
        customerId: req.user.getId()
      });

      res.status(201).json({
        status: 'SUCCESS',
        data: ride.toJSON()
      });
    } catch (err) {
      next(err);
    }
  };

  public getMine = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const rides = this._rideService.getCustomerRides(req.user.getId());

      res.status(200).json({
        status: 'SUCCESS',
        data: rides.map((r) => r.toJSON())
      });
    } catch (err) {
      next(err);
    }
  };

  public getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const ride = this._rideService.getRideById(id);
      res.status(200).json({
        status: 'SUCCESS',
        data: ride.toJSON()
      });
    } catch (err) {
      next(err);
    }
  };

  public cancel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const id = req.params.id as string;
      const { reason } = req.body;

      const result = this._rideService.cancelRide(id, req.user.getId(), reason);

      res.status(200).json({
        status: 'SUCCESS',
        data: {
          cancellationFee: result.fee,
          ride: result.ride.toJSON()
        }
      });
    } catch (err) {
      next(err);
    }
  };

  public rate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const id = req.params.id as string;
      const { score, comment } = req.body;

      const rating = this._rideService.rateDriver(id, req.user.getId(), Number(score), comment);

      res.status(200).json({
        status: 'SUCCESS',
        data: rating
      });
    } catch (err) {
      next(err);
    }
  };

  public track = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.params.token as string;
      const ride = this._rideService.getRideByTrackingToken(token);
      res.status(200).json({
        status: 'SUCCESS',
        data: ride.toJSON()
      });
    } catch (err) {
      next(err);
    }
  };
}
