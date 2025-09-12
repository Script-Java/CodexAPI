import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const COOKIE_NAME = "csrf-token";

export function generateCsrfToken() {
  const token = randomBytes(32).toString("hex");
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return token;
}

export function validateCsrfToken(token?: string | null) {
  const cookieToken = cookies().get(COOKIE_NAME)?.value;
  if (!token || !cookieToken || token !== cookieToken) {
    throw new Error("Invalid CSRF token");
  }
}
