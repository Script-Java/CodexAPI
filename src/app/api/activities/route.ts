import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { activitySchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api";
import { MembershipRole, ActivityType } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as ActivityType | null;
    const dealId = searchParams.get("dealId") ?? undefined;
    const activities = await prisma.activity.findMany({
      where: {
        organizationId: membership.organizationId,
        ...(type ? { type } : {}),
        ...(dealId ? { dealId } : {}),
      },
    });
    return NextResponse.json(activities);
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
    const data = activitySchema.parse(await req.json());
    const activity = await prisma.activity.create({
      data: {
        ...data,
        organizationId: membership.organizationId,
        ownerId: user.id,
      },
    });
    return NextResponse.json(activity, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

