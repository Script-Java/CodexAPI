import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { companySchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api";
import { MembershipRole } from "@prisma/client";
import { rateLimitWrite } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";

// GET list of companies & POST create new company
export async function GET(req: Request) {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;
    const companies = await prisma.company.findMany({
      where: {
        organizationId: membership.organizationId,
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      },
    });
    return NextResponse.json(companies);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const { membership, user } = await requireRole(
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
    const data = companySchema.parse(await req.json());
    const company = await prisma.company.create({
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
      entityType: "Company",
      entityId: company.id,
      after: company,
    });
    return NextResponse.json(company, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

