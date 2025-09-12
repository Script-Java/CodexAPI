"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";

export default function WonLostChartClient({
  data,
}: {
  data: { date: string; won: number; lost: number }[];
}) {
  const [range, setRange] = useState<30 | 90>(30);
  const filtered = data.slice(-range);
  return (
    <div>
      <div className="mb-2 flex gap-2">
        <Button
          size="sm"
          variant={range === 30 ? "default" : "outline"}
          onClick={() => setRange(30)}
        >
          30d
        </Button>
        <Button
          size="sm"
          variant={range === 90 ? "default" : "outline"}
          onClick={() => setRange(90)}
        >
          90d
        </Button>
      </div>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filtered}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="won" stroke="#82ca9d" />
            <Line type="monotone" dataKey="lost" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

