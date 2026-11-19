export const HTTP_STATUS_CODES = {
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const HTTP_RESPONSE_MESSAGES = {
  VALIDATION_ERROR: "Validation failed.",
};

// Largest Postgres integer, the type of every id column.
export const MAX_ID = 2_147_483_647;
