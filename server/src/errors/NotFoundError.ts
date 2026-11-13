import { AppError } from './AppError';

/** OOP: Inheritance
 *  WHY: Specializes AppError for missing system resources, enforcing a 404 Not Found HTTP status. */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

