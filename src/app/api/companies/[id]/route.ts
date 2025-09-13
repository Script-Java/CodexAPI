import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { companySchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api";
import { MembershipRole } from "@prisma/client";

export const runtime = "nodejs";

interface Params {
  params: { id: string };
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { membership } = await requireRole(
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const existing = await prisma.company.findFirst({
      where: { id: params.id, organizationId: membership.organizationId },
    });
    if (!existing) return new Response("Not Found", { status: 404 });
    const data = companySchema.partial().parse(await req.json());
    const company = await prisma.company.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(company);
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
    const existing = await prisma.company.findFirst({
      where: { id: params.id, organizationId: membership.organizationId },
    });
    if (!existing) return new Response("Not Found", { status: 404 });
    await prisma.company.delete({ where: { id: params.id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return handleApiError(e);
  }
}

