import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { MembershipRole, DealStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DealsByStageChartClient from "./deals-by-stage-chart-client";

export default async function DealsByStageChart() {
  const { membership } = await requireRole(
    MembershipRole.REP,
    MembershipRole.ADMIN,
    MembershipRole.OWNER
  );
  const stages = await prisma.stage.findMany({
    where: { pipeline: { organizationId: membership.organizationId } },
    include: {
      deals: { where: { status: DealStatus.OPEN }, select: { id: true } },
    },
    orderBy: { order: "asc" },
  });

  let data = stages.map((s) => ({ name: s.name, value: s.deals.length }));
  if (data.length === 0) {
    data = [
      { name: "Prospecting", value: 4 },
      { name: "Qualification", value: 3 },
      { name: "Proposal", value: 2 },
    ];
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deals by Stage</CardTitle>
      </CardHeader>
      <CardContent>
        <DealsByStageChartClient data={data} />
      </CardContent>
    </Card>
  );
}

