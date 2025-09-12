import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { activitySchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api";
import { MembershipRole, ActivityType } from "@prisma/client";
import { rateLimitWrite } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";

export async function GET(req: Request) {
  try {
    const { membership, user } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as ActivityType | null;
    const dealId = searchParams.get("dealId") ?? undefined;
    const due = searchParams.get("due");
    const owner = searchParams.get("owner");

    const now = new Date();
    const where: any = {
      organizationId: membership.organizationId,
      ...(type ? { type } : {}),
      ...(dealId ? { dealId } : {}),
    };

    if (owner === "mine") {
      where.ownerId = user.id;
    }

    if (due === "today") {
      where.dueAt = { gte: startOfDay(now), lt: endOfDay(now) };
    } else if (due === "week") {
      where.dueAt = { gte: startOfWeek(now), lt: endOfWeek(now) };
    } else if (due === "overdue") {
      where.dueAt = { lt: now };
      where.completedAt = null;
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { dueAt: "asc" },
      include: { owner: true },
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
    const { success } = await rateLimitWrite(req, user.id);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests, please try again later." },
        { status: 429 }
      );
    }
    const data = activitySchema.parse(await req.json());
    const activity = await prisma.activity.create({
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
      entityType: "Activity",
      entityId: activity.id,
      after: activity,
    });
    return NextResponse.json(activity, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

