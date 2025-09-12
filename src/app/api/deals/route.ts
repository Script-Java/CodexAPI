import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { dealSchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api";
import { MembershipRole, DealStatus } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as DealStatus | null;
    const deals = await prisma.deal.findMany({
      where: {
        organizationId: membership.organizationId,
        ...(status ? { status } : {}),
      },
    });
    return NextResponse.json(deals);
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
    const data = dealSchema.parse(await req.json());
    const deal = await prisma.deal.create({
      data: {
        ...data,
        organizationId: membership.organizationId,
        ownerId: user.id,
      },
    });
    return NextResponse.json(deal, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

