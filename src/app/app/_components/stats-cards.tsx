import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { MembershipRole, ActivityType, DealStatus } from "@prisma/client";
import { startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StatsCards() {
  const { membership } = await requireRole(
    MembershipRole.REP,
    MembershipRole.ADMIN,
    MembershipRole.OWNER
  );
  const orgId = membership.organizationId;
  const today = startOfDay(new Date());

  const [callsToday, newLeads, activeDeals, pipelineValue] = await Promise.all([
    prisma.activity.count({
      where: {
        organizationId: orgId,
        type: ActivityType.CALL,
        createdAt: { gte: today },
      },
    }),
    prisma.contact.count({
      where: { organizationId: orgId, createdAt: { gte: today } },
    }),
    prisma.deal.count({
      where: { organizationId: orgId, status: DealStatus.OPEN },
    }),
    prisma.deal.aggregate({
      _sum: { valueCents: true },
      where: { organizationId: orgId, status: DealStatus.OPEN },
    }),
  ]);

  const pipelineValueDollars = (pipelineValue._sum.valueCents || 0) / 100;
  const pipelineValueFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(pipelineValueDollars);

  const stats = [
    { label: "Today's Calls Logged", value: callsToday },
    { label: "New Leads", value: newLeads },
    { label: "Active Deals", value: activeDeals },
    { label: "Pipeline Value", value: pipelineValueFormatted },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{s.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

