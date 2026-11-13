import { AppError } from './AppError';

/** OOP: Inheritance
 *  WHY: Specializes AppError for authentication and access control failures, enforcing a 401 Unauthorized status code. */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

