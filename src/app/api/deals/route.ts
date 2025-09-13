import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { dealSchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api";
import { MembershipRole, DealStatus } from "@prisma/client";
import { rateLimitWrite } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";
import { cache } from "react";

export const runtime = "nodejs";

const fetchDeals = cache(
  async (
    organizationId: string,
    status: DealStatus | null,
    pipelineId: string | undefined,
    skip: number,
    take: number
  ) =>
    prisma.deal.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
        ...(pipelineId ? { pipelineId } : {}),
      },
      select: {
        id: true,
        title: true,
        valueCents: true,
        stageId: true,
        createdAt: true,
        company: { select: { name: true } },
        contact: { select: { firstName: true, lastName: true } },
        owner: { select: { name: true, email: true } },
      },
      skip,
      take,
    })
);

const countDeals = cache(
  async (
    organizationId: string,
    status: DealStatus | null,
    pipelineId: string | undefined
  ) =>
    prisma.deal.count({
      where: {
        organizationId,
        ...(status ? { status } : {}),
        ...(pipelineId ? { pipelineId } : {}),
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
    const status = searchParams.get("status") as DealStatus | null;
    const pipelineId = searchParams.get("pipelineId") ?? undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;
    const [deals, total] = await Promise.all([
      fetchDeals(membership.organizationId, status, pipelineId, skip, limit),
      countDeals(membership.organizationId, status, pipelineId),
    ]);
    return NextResponse.json({ data: deals, total });
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
    await createAuditLog({
      organizationId: membership.organizationId,
      userId: user.id,
      action: "CREATE",
      entityType: "Deal",
      entityId: deal.id,
      after: deal,
    });
    return NextResponse.json(deal, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

