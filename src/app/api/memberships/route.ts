import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { inviteSchema } from "@/lib/validators";
import { MembershipRole } from "@prisma/client";
import { sendInvitationEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { membership } = await requireRole(MembershipRole.OWNER);
    const members = await prisma.membership.findMany({
      where: { organizationId: membership.organizationId },
      include: { user: true },
    });
    return NextResponse.json(members);
  } catch (e) {
    return handleApiError(e);
  }
}

export async function POST(req: Request) {
  try {
    const { membership } = await requireRole(MembershipRole.OWNER);
    const { email, role } = inviteSchema.parse(await req.json());
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email } });
    }
    const existing = await prisma.membership.findFirst({
      where: { userId: user.id, organizationId: membership.organizationId },
    });
    if (existing) {
      return NextResponse.json({ error: "Already a member" }, { status: 400 });
    }
    const member = await prisma.membership.create({
      data: {
        userId: user.id,
        organizationId: membership.organizationId,
        role,
      },
    });
    await sendInvitationEmail(email);
    return NextResponse.json(member, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
