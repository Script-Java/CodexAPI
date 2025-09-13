import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { MembershipRole, FileBucket } from "@prisma/client";
import { rateLimitWrite } from "@/lib/rate-limit";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "application/pdf"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function GET(req: Request) {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get("dealId") ?? undefined;
    const contactId = searchParams.get("contactId") ?? undefined;
    const files = await prisma.file.findMany({
      where: {
        organizationId: membership.organizationId,
        ...(dealId ? { dealId } : {}),
        ...(contactId ? { contactId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(files);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const { membership, user } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const { success } = await rateLimitWrite(req, user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests, please try again later." },
        { status: 429 }
      );
    }
    const form = await req.formData();
    const file = form.get("file") as unknown as File | null;
    const dealId = form.get("dealId")?.toString();
    const contactId = form.get("contactId")?.toString();
    if (!file) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }
    const { url, pathname } = await put(file.name, file, { access: "public" });
    const created = await prisma.file.create({
      data: {
        organizationId: membership.organizationId,
        ownerId: user.id,
        dealId: dealId ?? undefined,
        contactId: contactId ?? undefined,
        bucket: FileBucket.VERCEL_BLOB,
        key: pathname,
        url,
        mime: file.type,
        size: file.size,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
