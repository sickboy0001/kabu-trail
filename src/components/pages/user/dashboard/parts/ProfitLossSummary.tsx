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
      <h3 className="text-xs sm:text-sm font-bold text-gray-500 mb-2 border-b border-gray-100 pb-1">
        {widget.title}
      </h3>
      <div className="flex flex-col justify-center flex-1 gap-1 px-2">
        {/* メイン: 合計損益 */}
        <div>
          <div className="text-xs text-gray-500 mb-1">合計損益</div>
          <div
            className={`text-2xl font-bold tracking-tight ${isPositive ? "text-red-500" : "text-blue-500"}`}
          >
            {isPositive ? "+" : ""}
            {totalPL.toLocaleString()}
          </div>
        </div>

        {/* サブ: 詳細リスト */}
        <div className="flex flex-col gap-1 border-t border-gray-100 pt-1">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center text-sm">
            <span className="text-gray-500">評価損益 (含み)</span>
            <span
              className={`font-bold self-end sm:self-auto ${totalUnrealizedPL >= 0 ? "text-red-500" : "text-blue-500"}`}
            >
              {totalUnrealizedPL >= 0 ? "+" : ""}
              {totalUnrealizedPL.toLocaleString()}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center text-sm">
            <span className="text-gray-500">実現損益 (確定)</span>
            <span
              className={`font-bold self-end sm:self-auto ${totalRealizedPL >= 0 ? "text-red-500" : "text-blue-500"}`}
            >
              {totalRealizedPL >= 0 ? "+" : ""}
              {totalRealizedPL.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
