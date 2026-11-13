import { AppError } from './AppError';

/** OOP: Inheritance
 *  WHY: Specializes AppError for permission and authorization guard violations, enforcing a 403 Forbidden HTTP status code. */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied: insufficient role permissions') {
    super(message, 403);
  }
}

