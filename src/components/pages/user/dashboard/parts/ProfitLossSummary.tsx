import React from "react";
import { Widget } from "../DashboardClient";
import { Position, ClosedTrade } from "@/hooks/useHoldingsData";

type Props = {
  widget: Widget;
  positions?: Position[];
  closedTrades?: ClosedTrade[];
};

export function ProfitLossSummary({
  widget,
  positions = [],
  closedTrades = [],
}: Props) {
  // 評価損益 (Open positions)
  const totalUnrealizedPL = positions.reduce(
    (sum, p) => sum + (p.valuationPL ?? 0),
    0,
  );

  // 実現損益 (Closed trades)
  const totalRealizedPL = closedTrades.reduce(
    (sum, t) => sum + (t.realizedPL ?? 0),
    0,
  );

  const totalPL = totalUnrealizedPL + totalRealizedPL;
  const isPositive = totalPL >= 0;

  return (
    <div className="flex flex-col justify-center h-full px-4 space-y-3">
      <div className="flex justify-between items-end border-b border-gray-100 pb-2">
        <span className="text-sm text-gray-500">評価損益 (含み)</span>
        <span
          className={`font-bold ${totalUnrealizedPL >= 0 ? "text-red-500" : "text-blue-500"}`}
        >
          {totalUnrealizedPL >= 0 ? "+" : ""}
          {totalUnrealizedPL.toLocaleString()}
        </span>
      </div>

      <div className="flex justify-between items-end border-b border-gray-100 pb-2">
        <span className="text-sm text-gray-500">実現損益 (確定)</span>
        <span
          className={`font-bold ${totalRealizedPL >= 0 ? "text-red-500" : "text-blue-500"}`}
        >
          {totalRealizedPL >= 0 ? "+" : ""}
          {totalRealizedPL.toLocaleString()}
        </span>
      </div>

      <div className="flex justify-between items-end pt-1">
        <span className="text-sm font-bold text-gray-700">合計損益</span>
        <span
          className={`text-lg font-bold ${isPositive ? "text-red-500" : "text-blue-500"}`}
        >
          {isPositive ? "+" : ""}
          {totalPL.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
