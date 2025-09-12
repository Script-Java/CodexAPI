import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { contactSchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api";
import { MembershipRole } from "@prisma/client";

interface Params {
  params: { id: string };
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const existing = await prisma.contact.findFirst({
      where: { id: params.id, organizationId: membership.organizationId },
    });
    if (!existing) return new Response("Not Found", { status: 404 });
    const data = contactSchema.partial().parse(await req.json());
    const contact = await prisma.contact.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(contact);
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
    const existing = await prisma.contact.findFirst({
      where: { id: params.id, organizationId: membership.organizationId },
    });
    if (!existing) return new Response("Not Found", { status: 404 });
    await prisma.contact.delete({ where: { id: params.id } });
    return new Response(null, { status: 204 });
  } catch (e) {
    return handleApiError(e);
  }
}

