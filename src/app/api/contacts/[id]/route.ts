import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { contactSchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api";
import { MembershipRole } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";

interface Params {
  params: { id: string };
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { membership, user } = await requireRole(
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
    await createAuditLog({
      organizationId: membership.organizationId,
      userId: user.id,
      action: "UPDATE",
      entityType: "Contact",
      entityId: contact.id,
      before: existing,
      after: contact,
    });
    return NextResponse.json(contact);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { membership, user } = await requireRole(
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const existing = await prisma.contact.findFirst({
      where: { id: params.id, organizationId: membership.organizationId },
    });
    if (!existing) return new Response("Not Found", { status: 404 });
    await prisma.contact.delete({ where: { id: params.id } });
    await createAuditLog({
      organizationId: membership.organizationId,
      userId: user.id,
      action: "DELETE",
      entityType: "Contact",
      entityId: existing.id,
      before: existing,
    });
    return new Response(null, { status: 204 });
  } catch (e) {
    return handleApiError(e);
  }
}

