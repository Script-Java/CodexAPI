import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { membershipSchema } from "@/lib/validators";
import { MembershipRole } from "@prisma/client";

export const runtime = "nodejs";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { membership } = await requireRole(MembershipRole.OWNER);
    const existing = await prisma.membership.findUnique({ where: { id: params.id } });
    if (!existing || existing.organizationId !== membership.organizationId) {
      return new NextResponse("Not found", { status: 404 });
    }
    const data = membershipSchema.parse(await req.json());
    const updated = await prisma.membership.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updated);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { membership } = await requireRole(MembershipRole.OWNER);
    const existing = await prisma.membership.findUnique({ where: { id: params.id } });
    if (!existing || existing.organizationId !== membership.organizationId) {
      return new NextResponse("Not found", { status: 404 });
    }
    await prisma.membership.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e);
  }
}
