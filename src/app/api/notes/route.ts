import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { noteSchema } from "@/lib/validators";
import { handleApiError } from "@/lib/api";
import { MembershipRole } from "@prisma/client";
import { rateLimitWrite } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: Request) {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get("dealId") ?? undefined;
    const contactId = searchParams.get("contactId") ?? undefined;
    const notes = await prisma.note.findMany({
      where: {
        organizationId: membership.organizationId,
        ...(dealId ? { dealId } : {}),
        ...(contactId ? { contactId } : {}),
      },
    });
    return NextResponse.json(notes);
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
    const data = noteSchema.parse(await req.json());
    const note = await prisma.note.create({
      data: {
        ...data,
        organizationId: membership.organizationId,
        authorId: user.id,
      },
    });
    await createAuditLog({
      organizationId: membership.organizationId,
      userId: user.id,
      action: "CREATE",
      entityType: "Note",
      entityId: note.id,
      after: note,
    });
    return NextResponse.json(note, { status: 201 });
  } catch (e) {
    return handleApiError(e);
  }
}

