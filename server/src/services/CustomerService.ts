import { IRepository } from '../repositories/IRepository';
import { User } from '../domain/User';
import { Customer } from '../domain/Customer';
import { SavedPlace } from '../domain/User';
import { PromoCode } from '../domain/promo/PromoCode';
import { NotFoundError } from '../errors';

/** OOP: Abstraction, Encapsulation
 *  WHY: Manages customer-specific operational workflows (wallet credits, saved destinations, promo validations) relying on Customer domain methods. */
export class CustomerService {
  private readonly _userRepo: IRepository<User>;
  private readonly _promoRepo: IRepository<PromoCode>;

  constructor(userRepo: IRepository<User>, promoRepo: IRepository<PromoCode>) {
    this._userRepo = userRepo;
    this._promoRepo = promoRepo;
  }

  private getCustomer(customerId: string): Customer {
    const user = this._userRepo.findById(customerId);
    if (!user || !(user instanceof Customer)) {
      throw new NotFoundError(`Customer with ID ${customerId} not found`);
    }
    return user;
  }

  public getWallet(customerId: string) {
    const customer = this.getCustomer(customerId);
    const wallet = customer.getWallet();
    return {
      walletId: wallet.getId(),
      balance: wallet.getBalance(),
      transactions: wallet.getTransactions()
    };
  }

  public topUpWallet(customerId: string, amount: number, description: string = 'User Top-up') {
    const customer = this.getCustomer(customerId);
    customer.getWallet().credit(amount, description);
    this._userRepo.save(customer);

    return {
      balance: customer.getWallet().getBalance(),
      message: `Successfully credited ₹${amount.toFixed(2)} to wallet`
    };
  }

  public getSavedPlaces(customerId: string): readonly SavedPlace[] {
    const customer = this.getCustomer(customerId);
    return customer.getSavedPlaces();
  }

  public addSavedPlace(customerId: string, place: SavedPlace): readonly SavedPlace[] {
    const customer = this.getCustomer(customerId);
    customer.addSavedPlace(place);
    this._userRepo.save(customer);
    return customer.getSavedPlaces();
  }

  public validatePromo(customerId: string, code: string) {
    const customer = this.getCustomer(customerId);
    const allPromos = this._promoRepo.findAll();
    const promo = allPromos.find((p) => p.getCode() === code.trim().toUpperCase());

    if (!promo || !promo.isValidFor(customer)) {
      return {
        valid: false,
        message: 'Promo code is invalid, expired, or redemption limit reached'
      };
    }

    return {
      valid: true,
      code: promo.getCode(),
      discountPercentage: promo.getDiscountPercentage(),
      maxDiscount: promo.getMaxDiscount()
    };
  }
}

