import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { handleApiError } from '@/lib/api';
import { MembershipRole } from '@prisma/client';
import { cache } from 'react';

export const runtime = 'nodejs';

const fetchPipeline = cache(async (organizationId: string) =>
  prisma.pipeline.findFirst({
    where: { organizationId },
    include: { stages: { orderBy: { order: 'asc' } } },
  })
);

export async function GET() {
  try {
    const { membership } = await requireRole(
      MembershipRole.REP,
      MembershipRole.ADMIN,
      MembershipRole.OWNER
    );
    const pipeline = await fetchPipeline(membership.organizationId);
    return NextResponse.json(pipeline);
  } catch (e) {
    return handleApiError(e);
  }
}
