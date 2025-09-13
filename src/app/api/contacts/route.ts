import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { contactSchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api";
import { MembershipRole } from "@prisma/client";
import { rateLimitWrite } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";
import { cache } from "react";

export const runtime = "nodejs";

const fetchContacts = cache(
  async (
    organizationId: string,
    q: string | undefined,
    skip: number,
    take: number
  ) =>
    prisma.contact.findMany({
      where: {
        organizationId,
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
      skip,
      take,
      orderBy: { lastName: "asc" },
    })
);

const countContacts = cache(
  async (organizationId: string, q: string | undefined) =>
    prisma.contact.count({
      where: {
        organizationId,
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    })
);

export async function GET(req: Request) {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const [contacts, total] = await Promise.all([
      fetchContacts(membership.organizationId, q, skip, limit),
      countContacts(membership.organizationId, q),
    ]);
    return NextResponse.json({ data: contacts, total });
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

