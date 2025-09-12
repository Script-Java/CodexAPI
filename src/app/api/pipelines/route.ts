import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api';
import { MembershipRole } from '@prisma/client';

export async function GET() {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const pipeline = await prisma.pipeline.findFirst({
      where: { organizationId: membership.organizationId },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
    return NextResponse.json(pipeline);
  } catch (e) {
    return handleApiError(e);
  }
}
