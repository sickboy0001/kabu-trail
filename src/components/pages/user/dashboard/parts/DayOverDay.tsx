import React from "react";
import { Widget } from "../DashboardClient";

type Props = {
  widget: Widget;
};

// ダミーデータ
const DAY_DATA = {
  diffAmount: 125000, // 前日比額
  diffPercent: 0.87, // 前日比率
};

export function DayOverDay({ widget }: Props) {
  const isPositive = DAY_DATA.diffAmount >= 0;

  return (
    <div className="flex flex-col gap-2 p-2 h-full justify-center">
      <div className="text-sm text-gray-500">前日比</div>

      <div
        className={`text-2xl font-bold tracking-tight ${isPositive ? "text-red-500" : "text-blue-500"}`}
      >
        {isPositive ? "+" : ""}
        {DAY_DATA.diffAmount.toLocaleString()}
        <span className="text-sm font-normal ml-1">円</span>
      </div>

      <div
        className={`text-sm font-medium ${isPositive ? "text-red-500" : "text-blue-500"}`}
      >
        {isPositive ? "▲" : "▼"} {Math.abs(DAY_DATA.diffPercent).toFixed(2)}%
      </div>

      <div className="mt-2 text-xs text-gray-400">前日終値との比較</div>
    </div>
  );
}
