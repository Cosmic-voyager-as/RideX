import { AppError } from './AppError';

/** OOP: Inheritance
 *  WHY: Specializes AppError for monetary deficit violations, signaling insufficient balance during debit operations. */
export class InsufficientFundsError extends AppError {
  constructor(message: string = 'Insufficient wallet funds for this operation') {
    super(message, 400);
  }
}

