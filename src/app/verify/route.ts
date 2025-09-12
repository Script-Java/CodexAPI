import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const existing = await prisma.verificationToken.findUnique({ where: { token } });
  if (!existing || existing.expires < new Date()) {
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  await prisma.user.update({
    where: { email: existing.identifier },
    data: { emailVerified: new Date() },
  });
  await prisma.verificationToken.delete({ where: { token } });

  return NextResponse.redirect(new URL("/login", request.url));
}
