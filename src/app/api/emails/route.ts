import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { handleApiError } from "@/lib/api";
import { MembershipRole, ActivityType } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { rateLimitWrite } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  to: z.string().email(),
  subject: z.string().trim().min(1),
  body: z.string().trim().min(1),
  dealId: z.string().cuid().optional(),
  contactId: z.string().cuid().optional(),
});

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
    const data = schema.parse(await req.json());
    await sendEmail({
      to: data.to,
      subject: data.subject,
      html: `<p>${data.body.replace(/\n/g, "<br/>")}</p>`,
      text: data.body,
    });
    const activity = await prisma.activity.create({
      data: {
        organizationId: membership.organizationId,
        ownerId: user.id,
        dealId: data.dealId,
        contactId: data.contactId,
        type: ActivityType.EMAIL,
        title: data.subject,
        note: data.body.slice(0, 200),
      },
    });
    return NextResponse.json(activity, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}
