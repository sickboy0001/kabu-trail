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

type Props = {
  widget: Widget;
};

// ダミーデータ生成
const generateDummyData = () => [
  { name: "トヨタ自動車", value: 4500000 },
  { name: "ソニーG", value: 3200000 },
  { name: "三菱UFJ", value: 2800000 },
  { name: "キーエンス", value: 2100000 },
  { name: "任天堂", value: 1500000 },
  { name: "その他", value: 3500000 },
];

const COLORS = [
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#ef4444", // red-500
  "#8b5cf6", // violet-500
  "#9ca3af", // gray-400
];

export function PortfolioPie({ widget }: Props) {
  const data = useMemo(() => generateDummyData(), []);

  return (
    <div className="w-full h-full min-h-[250px] p-2">
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
            formatter={(value: any) => [
              `${Number(value).toLocaleString()}円`,
              "評価額",
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
  );
}
