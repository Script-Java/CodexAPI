import { ZodError } from "zod";

/**
 * Helper to convert thrown errors from route handlers into
 * proper HTTP responses. Ensures consistent 401/403/422 codes
 * as required by the specification.
 */
export function handleApiError(error: any): Response {
  if (error?.message === "Unauthorized") {
    return new Response("Unauthorized", { status: 401 });
  }
  if (error?.message === "Forbidden") {
    return new Response("Forbidden", { status: 403 });
  }
  if (error instanceof ZodError) {
    return new Response(JSON.stringify({ issues: error.issues }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }
  console.error("API error", error?.message);
  return new Response("Internal Server Error", { status: 500 });
}

