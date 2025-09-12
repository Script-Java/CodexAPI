import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { dealSchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api";
import { MembershipRole, DealStatus } from "@prisma/client";
import { rateLimitWrite } from "@/lib/rate-limit";

export async function GET(req: Request) {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as DealStatus | null;
    const pipelineId = searchParams.get("pipelineId") ?? undefined;
    const deals = await prisma.deal.findMany({
      where: {
        organizationId: membership.organizationId,
        ...(status ? { status } : {}),
        ...(pipelineId ? { pipelineId } : {}),
      },
      include: { company: true, contact: true, owner: true },
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
    const { success } = await rateLimitWrite(req, user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests, please try again later." },
        { status: 429 }
      );
    }
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

