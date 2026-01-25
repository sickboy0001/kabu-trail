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
  const targetBuckets = widget.settings.targetBuckets as string[] | undefined;

  const filteredPositions =
    targetBuckets && targetBuckets.length > 0
      ? positions.filter(
          (p) => p.bucketId && targetBuckets.includes(p.bucketId),
        )
      : positions;

  const filteredTrades =
    targetBuckets && targetBuckets.length > 0
      ? closedTrades.filter(
          (t) => t.bucketId && targetBuckets.includes(t.bucketId),
        )
      : closedTrades;

  // 評価損益 (Open positions)
  const totalUnrealizedPL = filteredPositions.reduce(
    (sum, p) => sum + (p.valuationPL ?? 0),
    0,
  );

  // 実現損益 (Closed trades)
  const totalRealizedPL = filteredTrades.reduce(
    (sum, t) => sum + (t.realizedPL ?? 0),
    0,
  );

  const totalPL = totalUnrealizedPL + totalRealizedPL;
  const isPositive = totalPL >= 0;

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-sm font-bold text-gray-500 mb-2 border-b border-gray-100 pb-1">
        {widget.title}
      </h3>
      <div className="flex flex-col justify-center flex-1 space-y-3 px-2">
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
    </div>
  );
}
