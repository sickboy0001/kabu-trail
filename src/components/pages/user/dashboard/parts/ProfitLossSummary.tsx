import React from "react";
import { Widget } from "../DashboardClient";

type Props = {
  widget: Widget;
};

// ダミーデータ
const PL_DATA = {
  totalInvestment: 12500000, // 取得総額
  currentValue: 14500000, // 現在の評価額
};

export function ProfitLossSummary({ widget }: Props) {
  const profitLoss = PL_DATA.currentValue - PL_DATA.totalInvestment;
  const profitLossPercent = (profitLoss / PL_DATA.totalInvestment) * 100;
  const isPositive = profitLoss >= 0;

  return (
    <div className="flex flex-col gap-2 p-2 h-full justify-center">
      <div className="text-sm text-gray-500">評価損益</div>

      <div
        className={`text-2xl font-bold tracking-tight ${isPositive ? "text-red-500" : "text-blue-500"}`}
      >
        {isPositive ? "+" : ""}
        {profitLoss.toLocaleString()}
        <span className="text-sm font-normal ml-1">円</span>
      </div>

      <div
        className={`text-sm font-medium ${isPositive ? "text-red-500" : "text-blue-500"}`}
      >
        {isPositive ? "▲" : "▼"} {Math.abs(profitLossPercent).toFixed(2)}%
      </div>

      <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500 flex justify-between">
        <span>取得額:</span>
        <span>{PL_DATA.totalInvestment.toLocaleString()}</span>
      </div>
    </div>
  );
}
