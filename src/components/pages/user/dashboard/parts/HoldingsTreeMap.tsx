"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Treemap, ResponsiveContainer, Tooltip } from "recharts";
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

const CustomizedContent = (props: any) => {
  const router = useRouter();
  const { x, y, width, height, index, colors, name, value, code } = props;

  return (
    <g
      onClick={() => {
        if (code) {
          router.push(`/stock?code=${code}`);
        }
      }}
      style={{ cursor: "pointer" }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: colors[index % colors.length],
          stroke: "#fff",
          strokeWidth: 2,
          strokeOpacity: 1,
        }}
      />
      {width > 30 && height > 20 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={12}
          fontWeight="bold"
          dominantBaseline="middle"
          style={{ pointerEvents: "none" }}
        >
          {name}
        </text>
      )}
      {width > 50 && height > 40 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 16}
          textAnchor="middle"
          fill="#fff"
          fontSize={10}
          dominantBaseline="middle"
          style={{ pointerEvents: "none" }}
        >
          {Number(value).toLocaleString()}
        </text>
      )}
    </g>
  );
};

export function HoldingsTreeMap({ widget, positions = [] }: Props) {
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

    // 銘柄コードごとに集計
    const aggregated = filteredPositions.reduce(
      (acc, pos) => {
        const marketValue = pos.currentPrice * pos.quantity;
        if (!acc[pos.code]) {
          acc[pos.code] = {
            name: pos.name,
            value: 0,
            code: pos.code,
          };
        }
        acc[pos.code].value += marketValue;
        return acc;
      },
      {} as Record<string, { name: string; value: number; code: string }>,
    );

    // 配列に変換してソート
    return Object.values(aggregated)
      .map((item) => ({ name: item.name, size: item.value, code: item.code }))
      .sort((a, b) => b.size - a.size);
  }, [positions]);

  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        データなし
      </div>
    );
  }

  // 設定に応じた高さクラスの決定
  const getHeightClass = (heightSetting?: number) => {
    switch (heightSetting) {
      case 30:
        return "min-h-30";
      case 120:
        return "min-h-120";
      case 200:
        return "min-h-200";
      case 60:
      default:
        return "min-h-60";
    }
  };

  return (
    <div
      className={`w-full h-full flex flex-col ${getHeightClass(widget.settings.height)}`}
    >
      <h3 className="text-sm font-bold text-gray-500 mb-2 border-b border-gray-100 pb-1">
        {widget.title}
      </h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#fff"
            fill="#8884d8"
            content={<CustomizedContent colors={COLORS} />}
          >
            <Tooltip
              formatter={(value: any, name: any, props: any) => [
                `${Number(value).toLocaleString()}円`,
                props.payload.name,
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
              cursor={false}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
