import { prisma } from "@/lib/prisma";

interface AuditOptions {
  organizationId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
}

function diffObjects(
  before: Record<string, any> | null | undefined,
  after: Record<string, any> | null | undefined
) {
  const changes: Record<string, { before: any; after: any }> = {};
  const keys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);
  for (const key of keys) {
    const b = before ? before[key] : undefined;
    const a = after ? after[key] : undefined;
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      changes[key] = { before: b, after: a };
    }
  }
  return changes;
}

export async function createAuditLog(options: AuditOptions) {
  const { organizationId, userId, action, entityType, entityId, before, after } =
    options;
  const changes = diffObjects(before, after);
  await prisma.auditLog.create({
    data: {
      organizationId,
      userId,
      action,
      entityType,
      entityId,
      changes,
    },
  });
}

