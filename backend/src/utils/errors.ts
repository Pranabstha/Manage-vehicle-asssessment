import { HTTP_STATUS_CODES, HTTP_RESPONSE_MESSAGES } from "./constants.js";

export interface ExtractedErrorsType {
  [key: string]: string[];
}

export abstract class CustomError extends Error {
  public readonly httpStatus: number;

  constructor(msg: string, httpStatus: number) {
    super(msg);
    this.name = new.target.name;
    this.httpStatus = httpStatus;
  }
}

export class UnexpectedError extends CustomError {
  public static readonly status = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;

  constructor(msg = "Something went wrong. Please try again later.") {
    super(msg, UnexpectedError.status);
  }
}

export class NotFoundError extends CustomError {
  public static readonly status = HTTP_STATUS_CODES.NOT_FOUND;

  constructor(msg: string) {
    super(msg, NotFoundError.status);
  }
}

export class ValidationFailedError extends CustomError {
  public static readonly msg = HTTP_RESPONSE_MESSAGES.VALIDATION_ERROR;
  public static readonly status = HTTP_STATUS_CODES.UNPROCESSABLE_ENTITY;

  constructor(
    public errors: ExtractedErrorsType,
    msg: string = ValidationFailedError.msg,
  ) {
    super(msg, ValidationFailedError.status);
  }
}

export class BadRequestError extends CustomError {
  public static readonly status = HTTP_STATUS_CODES.BAD_REQUEST;

  constructor(msg: string) {
    super(msg, BadRequestError.status);
  }
}
