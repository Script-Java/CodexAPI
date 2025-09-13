import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { contactSchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api";
import { MembershipRole } from "@prisma/client";
import { rateLimitWrite } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;
    const contacts = await prisma.contact.findMany({
      where: {
        organizationId: membership.organizationId,
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    });
    return NextResponse.json(contacts);
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
    const data = contactSchema.parse(await req.json());
    const contact = await prisma.contact.create({
      data: {
        ...data,
        organizationId: membership.organizationId,
        ownerId: user.id,
      },
    });
    await createAuditLog({
      organizationId: membership.organizationId,
      userId: user.id,
      action: "CREATE",
      entityType: "Contact",
      entityId: contact.id,
      after: contact,
    });
    return NextResponse.json(contact, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

