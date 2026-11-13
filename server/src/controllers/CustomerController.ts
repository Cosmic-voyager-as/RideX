import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/CustomerService';
import { UnauthorizedError } from '../errors';

/** OOP: Abstraction
 *  WHY: Thin REST adapter for rider account operations (wallet balance/topup, saved destinations, promo checks). */
export class CustomerController {
  private readonly _customerService: CustomerService;

  constructor(customerService: CustomerService) {
    this._customerService = customerService;
  }

  public getWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const wallet = this._customerService.getWallet(req.user.getId());
      res.status(200).json({
        status: 'SUCCESS',
        data: wallet
      });
    } catch (err) {
      next(err);
    }
  };

  public topUpWallet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { amount, description } = req.body;
      const result = this._customerService.topUpWallet(
        req.user.getId(),
        Number(amount),
        description
      );
      res.status(200).json({
        status: 'SUCCESS',
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  public getSavedPlaces = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const places = this._customerService.getSavedPlaces(req.user.getId());
      res.status(200).json({
        status: 'SUCCESS',
        data: places
      });
    } catch (err) {
      next(err);
    }
  };

  public addSavedPlace = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const places = this._customerService.addSavedPlace(req.user.getId(), req.body);
      res.status(201).json({
        status: 'SUCCESS',
        data: places
      });
    } catch (err) {
      next(err);
    }
  };

  public applyPromo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { code } = req.body;
      const result = this._customerService.validatePromo(req.user.getId(), code);
      res.status(200).json({
        status: 'SUCCESS',
        data: result
      });
    } catch (err) {
      next(err);
    }
  };
}

