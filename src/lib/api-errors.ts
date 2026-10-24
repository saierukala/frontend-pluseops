import { toast } from "sonner";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api/errors";

/** Human message for any thrown value, preferring the API's own message. */
export function errorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error) return error.message || fallback;
  return fallback;
}

export function toastError(error: unknown, title = "Request failed") {
  toast.error(title, { description: errorMessage(error) });
}

interface ZodIssueLike {
  path?: Array<string | number>;
  message?: string;
}

/**
 * Maps backend VALIDATION_ERROR details (Zod issues with paths like ["body","email"]) onto form fields.
 * Returns true when at least one field error was applied so callers can skip a generic toast.
 */
export function applyApiFieldErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>, fields: readonly string[]): boolean {
  if (!(error instanceof ApiError) || !Array.isArray(error.details)) return false;
  let applied = false;
  for (const issue of error.details as ZodIssueLike[]) {
    const field = issue.path?.filter((p) => p !== "body").join(".");
    if (field && fields.includes(field)) {
      setError(field as Path<T>, { type: "server", message: issue.message ?? "Invalid value" });
      applied = true;
    }
  }
  return applied;
}
