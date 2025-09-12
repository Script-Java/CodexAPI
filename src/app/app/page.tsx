import { Suspense } from "react";
import StatsCards from "./_components/stats-cards";
import DealsByStageChart from "./_components/deals-by-stage-chart";
import WonLostChart from "./_components/won-lost-chart";
import RecentActivitiesTable from "./_components/recent-activities-table";

export default function AppHome() {
  return (
    <div className="space-y-4">
      <Suspense fallback={<div>Loading stats...</div>}>
        <StatsCards />
      </Suspense>
      <div className="grid gap-4 lg:grid-cols-2">
        <Suspense fallback={<div>Loading deals by stage...</div>}>
          <DealsByStageChart />
        </Suspense>
        <Suspense fallback={<div>Loading won vs lost...</div>}>
          <WonLostChart />
        </Suspense>
      </div>
      <Suspense fallback={<div>Loading activities...</div>}>
        <RecentActivitiesTable />
      </Suspense>
    </div>
  );
}

