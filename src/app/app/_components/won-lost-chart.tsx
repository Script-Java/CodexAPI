import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { MembershipRole, DealStatus } from "@prisma/client";
import { subDays, format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import WonLostChartClient from "./won-lost-chart-client";

function mockWonLostData(days: number) {
  return Array.from({ length: days }).map((_, i) => {
    const date = format(subDays(new Date(), days - i - 1), "yyyy-MM-dd");
    return {
      date,
      won: i % 3,
      lost: (i + 1) % 3,
    };
  });
}

export default async function WonLostChart() {
  const { membership } = await requireRole(
    MembershipRole.REP,
    MembershipRole.ADMIN,
    MembershipRole.OWNER
  );
  const orgId = membership.organizationId;
  const since = subDays(new Date(), 90);
  const deals = await prisma.deal.findMany({
    where: {
      organizationId: orgId,
      status: { in: [DealStatus.WON, DealStatus.LOST] },
      closeDate: { gte: since },
    },
    select: { status: true, closeDate: true },
  });

  const map = new Map<string, { won: number; lost: number }>();
  for (let i = 89; i >= 0; i--) {
    const d = subDays(new Date(), i);
    map.set(format(d, "yyyy-MM-dd"), { won: 0, lost: 0 });
  }
  for (const deal of deals) {
    if (!deal.closeDate) continue;
    const key = format(deal.closeDate, "yyyy-MM-dd");
    const entry = map.get(key);
    if (entry) {
      if (deal.status === DealStatus.WON) entry.won += 1;
      else entry.lost += 1;
    }
  }
  let data = Array.from(map.entries()).map(([date, counts]) => ({ date, ...counts }));
  if (deals.length === 0) {
    data = mockWonLostData(90);
  }

  return (
  <Card>
    <CardHeader>
      <CardTitle>Won vs Lost</CardTitle>
    </CardHeader>
    <CardContent>
      <WonLostChartClient data={data} />
    </CardContent>
  </Card>
  );
}

