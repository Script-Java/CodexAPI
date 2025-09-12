import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { noteSchema } from "@/lib/validators";
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
    const existing = await prisma.note.findFirst({
      where: { id: params.id, organizationId: membership.organizationId },
    });
    if (!existing) return new Response("Not Found", { status: 404 });
    const data = noteSchema.partial().parse(await req.json());
    const note = await prisma.note.update({
      where: { id: params.id },
      data,
    });
    await createAuditLog({
      organizationId: membership.organizationId,
      userId: user.id,
      action: "UPDATE",
      entityType: "Note",
      entityId: note.id,
      before: existing,
      after: note,
    });
    return NextResponse.json(note);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { membership, user } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const existing = await prisma.note.findFirst({
      where: { id: params.id, organizationId: membership.organizationId },
    });
    if (!existing) return new Response("Not Found", { status: 404 });
    await prisma.note.delete({ where: { id: params.id } });
    await createAuditLog({
      organizationId: membership.organizationId,
      userId: user.id,
      action: "DELETE",
      entityType: "Note",
      entityId: existing.id,
      before: existing,
    });
    return new Response(null, { status: 204 });
  } catch (e) {
    return handleApiError(e);
  }
}

