import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Widget } from "../DashboardClient";
import { Position } from "@/hooks/useHoldingsData";

type Props = {
  widget: Widget;
  positions?: Position[];
};

const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
  "#84cc16", // lime-500
  "#14b8a6", // teal-500
  "#eab308", // yellow-500
  "#d946ef", // fuchsia-500
  "#64748b", // slate-500
  "#a855f7", // purple-500
  "#0ea5e9", // sky-500
  "#22c55e", // green-500
  "#f43f5e", // rose-500
  "#78716c", // stone-500
  "#4b5563", // gray-600
];

export function HoldingsPie({ widget, positions = [] }: Props) {
  const data = useMemo(() => {
    if (!positions || positions.length === 0) return [];

    // 設定された口座でフィルタリング
    const targetBuckets = widget.settings.targetBuckets as string[] | undefined;
    const filteredPositions =
      targetBuckets && targetBuckets.length > 0
        ? positions.filter(
            (p) => p.bucketId && targetBuckets.includes(p.bucketId),
          )
        : positions;

    // 銘柄ごとに集計
    const aggregated = filteredPositions.reduce(
      (acc, pos) => {
        const marketValue = pos.currentPrice * pos.quantity;
        if (!acc[pos.name]) {
          acc[pos.name] = 0;
        }
        acc[pos.name] += marketValue;
        return acc;
      },
      {} as Record<string, number>,
    );

    // 配列に変換してソート
    return Object.entries(aggregated)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [positions]);

  if (data.length === 0) {
    return (
      <div className="w-full h-full flex flex-col">
        <h3 className="text-sm font-bold text-gray-500 mb-2 border-b border-gray-100 pb-1">
          {widget.title}
        </h3>
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          データなし
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[250px] flex flex-col">
      <h3 className="text-sm font-bold text-gray-500 mb-2 border-b border-gray-100 pb-1">
        {widget.title}
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [
                `${Number(value).toLocaleString()}円`,
                name,
              ]}
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "none",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              itemStyle={{ color: "#fff" }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value) => (
                <span className="text-xs text-gray-600 ml-1">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
