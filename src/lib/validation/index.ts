import { z } from "zod";

export * from "./schemas";

/**
 * Safe parse helper: returns the parsed+coerced value, or `fallback` if
 * validation fails. Logs a dev-only warning when invalid data is detected
 * so corrupt localStorage entries are visible during development without
 * crashing the UI in production.
 */
export function parseOrDefault<T>(
  schema: z.ZodType<T>,
  data: unknown,
  fallback: T,
  context?: string,
): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[Speech Adventure] Invalid${context ? ` ${context}` : ""} data in localStorage — using default.`,
    );
  }

  return fallback;
}

/**
 * Like parseOrDefault but returns null on failure instead of a fallback.
 * Used for optional resources (e.g., child profile) that may legitimately
 * be absent.
 */
export function parseOrNull<T>(
  schema: z.ZodType<T>,
  data: unknown,
  context?: string,
): T | null {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  if (process.env.NODE_ENV === "development") {
    console.warn(
      `[Speech Adventure] Invalid${context ? ` ${context}` : ""} data in localStorage — using null.`,
    );
  }

  return null;
}
