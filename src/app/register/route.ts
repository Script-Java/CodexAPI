import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MembershipRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { sendVerificationEmail } from "@/lib/email";
import { validateCsrfToken } from "@/lib/csrf";
import { rateLimitAuth } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const { success } = await rateLimitAuth(request);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests, please try again later." },
      { status: 429 }
    );
  }

  const contentType = request.headers.get("content-type") || "";
  let name: string | null = null;
  let email: string | null = null;
  let password: string | null = null;
  let csrfToken: string | null = null;

  if (contentType.includes("application/json")) {
    const body = await request.json();
    name = body.name;
    email = body.email;
    password = body.password;
    csrfToken = body.csrf;
  } else {
    const form = await request.formData();
    name = form.get("name")?.toString() || null;
    email = form.get("email")?.toString() || null;
    password = form.get("password")?.toString() || null;
    csrfToken = form.get("csrf")?.toString() || null;
  }

  validateCsrfToken(csrfToken);

  const existing = await prisma.user.findUnique({ where: { email: email! } });
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password!, 10);
  const token = randomUUID();
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
      memberships: {
        create: {
          role: MembershipRole.OWNER,
          organization: {
            create: {
              name: `${name || email!}'s Organization`,
              slug: `${email!.split("@")[0]}-${Date.now()}`,
              pipelines: {
                create: {
                  name: "Default",
                  stages: {
                    create: [
                      { name: "Lead", order: 1 },
                      { name: "Qualified", order: 2 },
                      { name: "Proposal", order: 3 },
                      { name: "Negotiation", order: 4 },
                      { name: "Closed Won", order: 5 },
                      { name: "Closed Lost", order: 6 },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: email!,
      token,
      expires,
    },
  });

  await sendVerificationEmail(email!, token);

  return NextResponse.json({ success: true });
}
