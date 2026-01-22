import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Widget } from "../DashboardClient";

type Props = {
  widget: Widget;
};

// ダミーデータ生成
const generateDummyData = () => {
  const data = [];
  const today = new Date();
  // 1年前から現在までの12ヶ月分
  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    // 1000万〜1500万の間でランダムな資産額を生成
    const baseValue = 10000000;
    const randomFluctuation = Math.floor(Math.random() * 5000000);
    // 徐々に増えているように見せるための係数
    const trend = (12 - i) * 200000;

    data.push({
      month: `${d.getMonth() + 1}月`,
      value: baseValue + randomFluctuation + trend,
    });
  }
  return data;
};

export function AssetHistory({ widget }: Props) {
  const data = useMemo(() => generateDummyData(), []);

  return (
    <div className="w-full h-full min-h-50 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f3f4f6"
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            dy={5}
          />
          <Tooltip
            formatter={(value: any) => [
              `${Number(value).toLocaleString()}円`,
              "資産額",
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
            cursor={{ fill: "#f3f4f6" }}
          />
          <Bar
            dataKey="value"
            fill="#60a5fa"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
