import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { MembershipRole } from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PAGE_SIZE = 20;

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const { membership } = await requireRole(
    MembershipRole.ADMIN,
    MembershipRole.OWNER
  );
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { organizationId: membership.organizationId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({
      where: { organizationId: membership.organizationId },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Audit Log</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Changes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{log.createdAt.toLocaleString()}</TableCell>
              <TableCell>{log.user?.name || ""}</TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell>
                {log.entityType} {log.entityId}
              </TableCell>
              <TableCell>
                {Object.entries(log.changes as any).map(([key, change]) => (
                  <div key={key} className="text-xs">
                    <strong>{key}</strong>: {JSON.stringify((change as any).before)} → {JSON.stringify((change as any).after)}
                  </div>
                ))}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-between items-center">
        <Link
          className={`text-sm ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
          href={`/app/settings/audit?page=${page - 1}`}
        >
          Previous
        </Link>
        <div className="text-sm">
          Page {page} of {totalPages}
        </div>
        <Link
          className={`text-sm ${
            page >= totalPages ? "pointer-events-none opacity-50" : ""
          }`}
          href={`/app/settings/audit?page=${page + 1}`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}

