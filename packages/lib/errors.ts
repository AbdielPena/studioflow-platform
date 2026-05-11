export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "UNAUTHORIZED"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "PRECONDITION_FAILED"
  | "EXTERNAL_SERVICE_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: unknown;
  readonly module?: string;

  constructor(opts: {
    code: ErrorCode;
    message: string;
    statusCode?: number;
    details?: unknown;
    module?: string;
    cause?: unknown;
  }) {
    super(opts.message);
    this.name = "AppError";
    this.code = opts.code;
    this.statusCode = opts.statusCode ?? defaultStatusFor(opts.code);
    this.details = opts.details;
    this.module = opts.module;
    if (opts.cause) (this as { cause?: unknown }).cause = opts.cause;
  }
}

function defaultStatusFor(code: ErrorCode): number {
  switch (code) {
    case "VALIDATION_ERROR":
    case "BAD_REQUEST":
      return 400;
    case "UNAUTHORIZED":
      return 401;
    case "FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "CONFLICT":
      return 409;
    case "PRECONDITION_FAILED":
      return 412;
    case "RATE_LIMITED":
      return 429;
    case "EXTERNAL_SERVICE_ERROR":
      return 502;
    case "INTERNAL_ERROR":
    default:
      return 500;
  }
}

export function throwAppError(opts: ConstructorParameters<typeof AppError>[0]): never {
  throw new AppError(opts);
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string; details?: unknown } };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(
  code: ErrorCode,
  message: string,
  details?: unknown,
): ActionResult<T> {
  return { ok: false, error: { code, message, details } };
}

export function toActionResult<T>(error: unknown): ActionResult<T> {
  if (isAppError(error)) {
    return fail(error.code, error.message, error.details);
  }
  return fail("INTERNAL_ERROR", "Ha ocurrido un error inesperado");
}
