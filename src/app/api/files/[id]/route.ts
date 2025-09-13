import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { MembershipRole } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const file = await prisma.file.findFirst({
      where: { id: params.id, organizationId: membership.organizationId },
    });
    if (!file) return new NextResponse("Not Found", { status: 404 });
    return NextResponse.redirect(file.url);
  } catch (e) {
    return handleApiError(e);
  }
}
