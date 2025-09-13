import { format } from "date-fns";
import { requireRole } from "@/lib/auth";
import { MembershipRole } from "@prisma/client";
import {
  pipelineValueByStage,
  winRateByOwner,
  cycleTime,
} from "@/lib/reports";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams?: { from?: string; to?: string };
}) {
  const { membership } = await requireRole(
    MembershipRole.REP,
    MembershipRole.ADMIN,
    MembershipRole.OWNER
  );
  const from = searchParams?.from ? new Date(searchParams.from) : undefined;
  const to = searchParams?.to ? new Date(searchParams.to) : undefined;
  const pipeline = await pipelineValueByStage(membership.organizationId);
  const winRates = await winRateByOwner(
    membership.organizationId,
    from,
    to
  );
  const cycle = await cycleTime(membership.organizationId, from, to);
  const fromStr = from ? format(from, "yyyy-MM-dd") : "";
  const toStr = to ? format(to, "yyyy-MM-dd") : "";
  return (
    <div className="p-4 space-y-8">
      <section>
        <h2 className="text-xl font-semibold mb-2">
          Pipeline Value by Stage
        </h2>
        <table className="min-w-full text-sm mb-2">
          <thead>
            <tr>
              <th className="text-left p-1">Stage</th>
              <th className="text-left p-1">Value</th>
            </tr>
          </thead>
          <tbody>
            {pipeline.map((p) => (
              <tr key={p.stage}>
                <td className="p-1">{p.stage}</td>
                <td className="p-1">${p.value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <a
          href="/api/reports/pipeline-value-by-stage?format=csv"
          className="text-blue-600 underline"
        >
          Download CSV
        </a>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Win Rate by Owner</h2>
        <table className="min-w-full text-sm mb-2">
          <thead>
            <tr>
              <th className="text-left p-1">Owner</th>
              <th className="text-left p-1">Won</th>
              <th className="text-left p-1">Lost</th>
              <th className="text-left p-1">Win Rate</th>
            </tr>
          </thead>
          <tbody>
            {winRates.map((w) => (
              <tr key={w.owner}>
                <td className="p-1">{w.owner}</td>
                <td className="p-1">{w.won}</td>
                <td className="p-1">{w.lost}</td>
                <td className="p-1">{w.winRate.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
        <a
          href={`/api/reports/win-rate?from=${fromStr}&to=${toStr}&format=csv`}
          className="text-blue-600 underline"
        >
          Download CSV
        </a>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">
          Cycle Time (Open → Won)
        </h2>
        <p className="mb-2 text-sm">
          Average: {cycle.average.toFixed(2)} days
        </p>
        <table className="min-w-full text-sm mb-2">
          <thead>
            <tr>
              <th className="text-left p-1">Deal</th>
              <th className="text-left p-1">Owner</th>
              <th className="text-left p-1">Days</th>
            </tr>
          </thead>
          <tbody>
            {cycle.deals.map((d) => (
              <tr key={d.deal}>
                <td className="p-1">{d.deal}</td>
                <td className="p-1">{d.owner}</td>
                <td className="p-1">{d.days}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <a
          href={`/api/reports/cycle-time?from=${fromStr}&to=${toStr}&format=csv`}
          className="text-blue-600 underline"
        >
          Download CSV
        </a>
      </section>
    </div>
  );
}
