import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { MembershipRole } from "@prisma/client";
import { handleApiError } from "@/lib/api";
import { winRateByOwner } from "@/lib/reports";

export async function GET(req: Request) {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const data = await winRateByOwner(
      membership.organizationId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined
    );
    if (searchParams.get("format") === "csv") {
      const csv = ["Owner,Won,Lost,Win Rate"]
        .concat(
          data.map((d) => `${d.owner},${d.won},${d.lost},${d.winRate}`)
        )
        .join("\n");
      return new NextResponse(csv, {
        headers: { "Content-Type": "text/csv" },
      });
    }
    return NextResponse.json(data);
  } catch (e) {
    return handleApiError(e);
  }
}
