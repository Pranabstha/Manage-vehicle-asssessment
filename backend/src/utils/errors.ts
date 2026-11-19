export interface FieldErrors {
  [field: string]: string[];
}

export abstract class CustomError extends Error {
  constructor(
    msg: string,
    public readonly httpStatus: number,
  ) {
    super(msg);
  }
}

export class UnexpectedError extends CustomError {
  constructor(msg = "Something went wrong. Please try again later.") {
    super(msg, 500);
  }
}

export class NotFoundError extends CustomError {
  constructor(msg: string) {
    super(msg, 404);
  }
}

export class ValidationFailedError extends CustomError {
  constructor(
    public readonly errors: FieldErrors,
    msg = "Validation failed.",
  ) {
    super(msg, 422);
  }
}

export class BadRequestError extends CustomError {
  constructor(msg: string) {
    super(msg, 400);
  }
}

export class PayloadTooLargeError extends CustomError {
  constructor(msg: string) {
    super(msg, 413);
  }
}
