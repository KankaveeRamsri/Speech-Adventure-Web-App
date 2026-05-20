/**
 * Typed error hierarchy for Supabase repository operations.
 *
 * Catch these at the call-site when callers need to distinguish failure
 * reasons. For UI-facing code, prefer returning safe defaults and only
 * surfacing errors through application-level error state.
 */

export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "RepositoryError";
    // Maintains proper prototype chain in transpiled ES5.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when an operation requires an authenticated Supabase session
 *  but none is available (user not signed in, or token expired). */
export class AuthRequiredError extends RepositoryError {
  constructor(operation: string) {
    super(`${operation}: authenticated session required`);
    this.name = "AuthRequiredError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when a Supabase query returns an error response. */
export class QueryError extends RepositoryError {
  constructor(
    public readonly table: string,
    public readonly operation: string,
    cause?: unknown,
  ) {
    super(`${operation} on '${table}' failed`, cause);
    this.name = "QueryError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when a required row is not found (e.g. child_profiles for auth user). */
export class NotFoundError extends RepositoryError {
  constructor(table: string, hint?: string) {
    super(`No row found in '${table}'${hint ? ` (${hint})` : ""}`);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Logs a repository error in development. No-op in production.
 *  For RepositoryError subclasses, also expands the Supabase cause object so
 *  message/code/details/hint are visible without manually drilling into the object. */
export function warnRepo(context: string, err: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[Repository:${context}]`, err);
    if (err instanceof RepositoryError && err.cause != null) {
      const c = err.cause as Record<string, unknown>;
      if (c.message != null || c.code != null) {
        console.warn(`  ↳ supabase error:`, {
          message: c.message,
          code: c.code,
          details: c.details,
          hint: c.hint,
        });
      } else {
        console.warn(`  ↳ cause:`, err.cause);
      }
    }
  }
}
