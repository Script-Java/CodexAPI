import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { contactSchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api";
import { MembershipRole } from "@prisma/client";

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
    const data = contactSchema.parse(await req.json());
    const contact = await prisma.contact.create({
      data: {
        ...data,
        organizationId: membership.organizationId,
        ownerId: user.id,
      },
    });
    return NextResponse.json(contact, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

