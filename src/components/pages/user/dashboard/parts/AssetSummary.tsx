import React from "react";
import { Widget } from "../DashboardClient";
import { Position, ClosedTrade } from "@/hooks/useHoldingsData";

type Props = {
  widget: Widget;
  positions?: Position[];
  closedTrades?: ClosedTrade[];
};

export function AssetSummary({
  widget,
  positions = [],
  closedTrades = [],
}: Props) {
  // 評価額の計算
  const totalInvestment = positions.reduce(
    (sum, p) => sum + p.entryPrice * p.quantity,
    0,
  );
  const currentMarketValue = positions.reduce(
    (sum, p) => sum + p.currentPrice * p.quantity,
    0,
  );
  const totalUnrealizedPL = currentMarketValue - totalInvestment;

  // 損益率
  const plPercent =
    totalInvestment !== 0 ? (totalUnrealizedPL / totalInvestment) * 100 : 0;

  const isPositive = totalUnrealizedPL >= 0;

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-2">
      <div className="text-center">
        <div className="text-xs text-gray-500 mb-1">株式評価額</div>
        <div className="text-2xl font-bold text-gray-800">
          ¥{currentMarketValue.toLocaleString()}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="text-center">
          <div className="text-xs text-gray-500">評価損益</div>
          <div
            className={`font-bold ${isPositive ? "text-red-500" : "text-blue-500"}`}
          >
            {isPositive ? "+" : ""}
            {totalUnrealizedPL.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500">損益率</div>
          <div
            className={`font-bold ${isPositive ? "text-red-500" : "text-blue-500"}`}
          >
            {isPositive ? "+" : ""}
            {plPercent.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}
