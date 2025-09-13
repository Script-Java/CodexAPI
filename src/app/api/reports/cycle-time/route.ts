import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { MembershipRole } from "@prisma/client";
import { handleApiError } from "@/lib/api";
import { cycleTime } from "@/lib/reports";

export const runtime = "nodejs";

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
    const result = await cycleTime(
      membership.organizationId,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined
    );
    if (searchParams.get("format") === "csv") {
      const csv = ["Deal,Owner,Cycle Time (days)"]
        .concat(result.deals.map((d) => `${d.deal},${d.owner},${d.days}`))
        .join("\n");
      return new NextResponse(csv, {
        headers: { "Content-Type": "text/csv" },
      });
    }
    return NextResponse.json(result);
  } catch (e) {
    return handleApiError(e);
  }
}
