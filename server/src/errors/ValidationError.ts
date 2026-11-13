import { AppError } from './AppError';

/** OOP: Inheritance
 *  WHY: Specializes AppError for validation failures, enforcing a 400 Bad Request status code. */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

