import type { ErrorRequestHandler } from "express";
import {
  BadRequestError,
  CustomError,
  type ExtractedErrorsType,
  UnexpectedError,
  ValidationFailedError,
} from "../utils/errors.js";

interface JsonResponse {
  failed: boolean;
  message: string;
  errors?: ExtractedErrorsType;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof SyntaxError && "body" in err) {
    err = new BadRequestError("Request body is not valid JSON.");
  }

  if (!(err instanceof CustomError)) {
    console.error(err);
    err = new UnexpectedError();
  }

  const payload: JsonResponse = { failed: true, message: err.message };

  if (err instanceof ValidationFailedError) {
    payload.errors = err.errors;
  }

  res.status(err.httpStatus).json(payload);
};
