import { prisma } from "@/lib/prisma";
import { DealStatus } from "@prisma/client";
import { differenceInDays } from "date-fns";

export async function pipelineValueByStage(organizationId: string) {
  const stages = await prisma.stage.findMany({
    where: { pipeline: { organizationId } },
    include: {
      deals: { where: { status: DealStatus.OPEN }, select: { valueCents: true } },
    },
    orderBy: { order: "asc" },
  });
  return stages.map((s) => ({
    stage: s.name,
    value: s.deals.reduce((sum, d) => sum + d.valueCents, 0) / 100,
  }));
}

export async function winRateByOwner(
  organizationId: string,
  from?: Date,
  to?: Date
) {
  const deals = await prisma.deal.findMany({
    where: {
      organizationId,
      status: { in: [DealStatus.WON, DealStatus.LOST] },
      ...(from || to
        ? {
            closeDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    select: {
      status: true,
      owner: { select: { id: true, name: true } },
    },
  });

  const map = new Map<
    string,
    { owner: string; won: number; lost: number }
  >();
  for (const deal of deals) {
    const id = deal.owner.id;
    const entry =
      map.get(id) || {
        owner: deal.owner.name ?? "Unknown",
        won: 0,
        lost: 0,
      };
    if (deal.status === DealStatus.WON) entry.won += 1;
    else entry.lost += 1;
    map.set(id, entry);
  }
  return Array.from(map.values()).map((e) => ({
    owner: e.owner,
    won: e.won,
    lost: e.lost,
    winRate: e.won + e.lost > 0 ? (e.won / (e.won + e.lost)) * 100 : 0,
  }));
}

export async function cycleTime(
  organizationId: string,
  from?: Date,
  to?: Date
) {
  const deals = await prisma.deal.findMany({
    where: {
      organizationId,
      status: DealStatus.WON,
      ...(from || to
        ? {
            closeDate: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    select: {
      title: true,
      createdAt: true,
      closeDate: true,
      owner: { select: { name: true } },
    },
  });

  const data = deals.map((d) => ({
    deal: d.title,
    owner: d.owner?.name ?? "Unknown",
    days: d.closeDate ? differenceInDays(d.closeDate, d.createdAt) : 0,
  }));
  const average =
    data.length > 0
      ? data.reduce((sum, d) => sum + d.days, 0) / data.length
      : 0;
  return { deals: data, average };
}
