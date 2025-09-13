import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { organizationSchema } from "@/lib/validators";
import { MembershipRole } from "@prisma/client";

export async function GET() {
  try {
    const { membership } = await requireRole(MembershipRole.OWNER);
    const org = await prisma.organization.findUnique({
      where: { id: membership.organizationId },
    });
    return NextResponse.json(org);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function PUT(req: Request) {
  try {
    const { membership } = await requireRole(MembershipRole.OWNER);
    const data = organizationSchema.parse(await req.json());
    const org = await prisma.organization.update({
      where: { id: membership.organizationId },
      data,
    });
    return NextResponse.json(org);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE() {
  try {
    const { membership } = await requireRole(MembershipRole.OWNER);
    await prisma.organization.delete({ where: { id: membership.organizationId } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
