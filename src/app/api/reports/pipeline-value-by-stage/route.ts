import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { MembershipRole } from "@prisma/client";
import { handleApiError } from "@/lib/api";
import { pipelineValueByStage } from "@/lib/reports";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const data = await pipelineValueByStage(membership.organizationId);
    const { searchParams } = new URL(req.url);
    if (searchParams.get("format") === "csv") {
      const csv = ["Stage,Value"]
        .concat(data.map((d) => `${d.stage},${d.value}`))
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
