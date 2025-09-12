import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { MembershipRole } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    if (!q) {
      return NextResponse.json([]);
    }

    const orgId = membership.organizationId;
    const results = await prisma.$queryRaw<
      { type: string; id: string; label: string }[]
    >`
      SELECT 'company' AS type, id, name AS label
      FROM "Company"
      WHERE "organizationId" = ${orgId}
        AND to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(domain,'')) @@ plainto_tsquery('simple', ${q})
      UNION ALL
      SELECT 'contact' AS type, id, (coalesce("firstName",'') || ' ' || coalesce("lastName",'')) AS label
      FROM "Contact"
      WHERE "organizationId" = ${orgId}
        AND to_tsvector('simple', coalesce("firstName",'') || ' ' || coalesce("lastName",'') || ' ' || coalesce(email,'')) @@ plainto_tsquery('simple', ${q})
      UNION ALL
      SELECT 'deal' AS type, id, title AS label
      FROM "Deal"
      WHERE "organizationId" = ${orgId}
        AND to_tsvector('simple', coalesce(title,'')) @@ plainto_tsquery('simple', ${q})
      LIMIT 20
    `;

    return NextResponse.json(results);
  } catch (e) {
    return handleApiError(e);
  }
}
