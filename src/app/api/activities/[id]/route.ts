import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { activitySchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api";
import { MembershipRole } from "@prisma/client";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

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
    const existing = await prisma.activity.findFirst({
      where: { id: params.id, organizationId: membership.organizationId },
    });
    if (!existing) return new Response("Not Found", { status: 404 });
    const data = activitySchema.partial().parse(await req.json());
    const activity = await prisma.activity.update({
      where: { id: params.id },
      data,
    });
    await createAuditLog({
      organizationId: membership.organizationId,
      userId: user.id,
      action: "UPDATE",
      entityType: "Activity",
      entityId: activity.id,
      before: existing,
      after: activity,
    });
    return NextResponse.json(activity);
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
    const existing = await prisma.activity.findFirst({
      where: { id: params.id, organizationId: membership.organizationId },
    });
    if (!existing) return new Response("Not Found", { status: 404 });
    await prisma.activity.delete({ where: { id: params.id } });
    await createAuditLog({
      organizationId: membership.organizationId,
      userId: user.id,
      action: "DELETE",
      entityType: "Activity",
      entityId: existing.id,
      before: existing,
    });
    return new Response(null, { status: 204 });
  } catch (e) {
    return handleApiError(e);
  }
}

