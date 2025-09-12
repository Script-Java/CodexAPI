import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { dealSchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api";
import { MembershipRole } from "@prisma/client";

interface Params {
  params: { id: string };
}

export async function GET(_req: Request, { params }: Params) {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const deal = await prisma.deal.findFirst({
      where: { id: params.id, organizationId: membership.organizationId },
      include: { company: true, contact: true, owner: true, stage: true },
    });
    if (!deal) return new Response("Not Found", { status: 404 });
    return NextResponse.json(deal);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const existing = await prisma.deal.findFirst({
      where: { id: params.id, organizationId: membership.organizationId },
    });
    if (!existing) return new Response("Not Found", { status: 404 });
    const data = dealSchema.partial().parse(await req.json());
    const deal = await prisma.deal.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(deal);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { membership } = await requireRole(
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const existing = await prisma.deal.findFirst({
      where: { id: params.id, organizationId: membership.organizationId },
    });
    if (!existing) return new Response("Not Found", { status: 404 });
    await prisma.deal.delete({ where: { id: params.id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return handleApiError(e);
  }
}

