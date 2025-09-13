import { GET, POST as NextAuthPost } from "@/auth";
import { rateLimitAuth } from "@/lib/rate-limit";

export const runtime = "nodejs";

export { GET };

export async function POST(req: Request) {
  const { success } = await rateLimitAuth(req);
  if (!success) {
    return new Response("Too many requests, please try again later.", { status: 429 });
  }
  return NextAuthPost(req);
}
