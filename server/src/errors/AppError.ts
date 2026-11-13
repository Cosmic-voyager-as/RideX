/** OOP: Inheritance, Abstraction
 *  WHY: Serves as the abstract base error class in the exception hierarchy, capturing HTTP status codes and operational status while extending Node's standard Error. */
export abstract class AppError extends Error {
  // ENCAPSULATION: Readonly metadata describing the error condition
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    if (new.target === AppError) {
      throw new Error('Cannot instantiate abstract class AppError directly');
    }
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Restore prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

