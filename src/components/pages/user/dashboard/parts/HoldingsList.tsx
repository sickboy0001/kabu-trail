import React, { useMemo } from "react";
import Link from "next/link";
import { Widget } from "../DashboardClient";
import { Position } from "@/hooks/useHoldingsData";

type Props = {
  widget: Widget;
  positions?: Position[];
};

export function HoldingsList({ widget, positions = [] }: Props) {
  const sortedPositions = useMemo(() => {
    return [...positions].sort((a, b) => {
      if (a.entryDate > b.entryDate) return -1;
      if (a.entryDate < b.entryDate) return 1;
      return 0;
    });
  }, [positions]);

  if (!sortedPositions || sortedPositions.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        保有銘柄がありません
      </div>
    );
  }

  // 日付の差分計算ヘルパー
  const getDaysDiff = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="w-full h-full overflow-auto">
      {/* PC表示: テーブル */}
      <table className="min-w-full text-left text-xs whitespace-nowrap hidden md:table">
        <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
          <tr>
            <th className="px-3 py-2 font-medium text-gray-500">銘柄</th>
            <th className="px-3 py-2 font-medium text-gray-500">口座</th>
            <th className="px-3 py-2 font-medium text-gray-500">取得日</th>
            <th className="px-3 py-2 font-medium text-gray-500 text-right">
              取得株数
            </th>
            <th className="px-3 py-2 font-medium text-gray-500 text-right">
              取得単価
            </th>
            <th className="px-3 py-2 font-medium text-gray-500 text-right">
              取得金額
            </th>
            <th className="px-3 py-2 font-medium text-gray-500 text-right">
              保有期間
            </th>
            <th className="px-3 py-2 font-medium text-gray-500 text-right">
              現在値
            </th>
            <th className="px-3 py-2 font-medium text-gray-500 text-right">
              評価額
            </th>
            <th className="px-3 py-2 font-medium text-gray-500 text-right">
              評価損益
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedPositions.map((pos) => {
            const purchaseAmount = pos.entryPrice * pos.quantity;
            const marketValue = pos.currentPrice * pos.quantity;
            const pl = pos.valuationPL ?? 0;
            const plPercent =
              purchaseAmount !== 0 ? (pl / purchaseAmount) * 100 : 0;
            const isPositive = pl >= 0;

            return (
              <tr key={pos.id} className="hover:bg-gray-50">
                <td className="px-3 py-2">
                  <Link
                    href={`/stock?code=${pos.code}`}
                    className="block group"
                  >
                    <div className="font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
                      {pos.name}
                    </div>
                    <div className="text-gray-400 text-[10px] group-hover:text-blue-500 transition-colors">
                      {pos.code}
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-2 text-gray-600">{pos.accountName}</td>
                <td className="px-3 py-2 text-gray-600">{pos.entryDate}</td>
                <td className="px-3 py-2 text-right text-gray-700">
                  {pos.quantity.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right text-gray-700">
                  {pos.entryPrice.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right text-gray-700">
                  {purchaseAmount.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right text-gray-600">
                  {getDaysDiff(pos.entryDate)}日
                </td>
                <td className="px-3 py-2 text-right font-medium text-gray-700">
                  {pos.currentPrice.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right font-medium text-gray-700">
                  {marketValue.toLocaleString()}
                </td>
                <td
                  className={`px-3 py-2 text-right font-bold ${isPositive ? "text-red-500" : "text-blue-500"}`}
                >
                  {isPositive ? "+" : ""}
                  {pl.toLocaleString()}
                  <div className="text-[10px] font-normal">
                    ({isPositive ? "+" : ""}
                    {plPercent.toFixed(2)}%)
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* スマホ表示: カードリスト */}
      <div className="md:hidden space-y-2 p-1">
        {sortedPositions.map((pos) => {
          const purchaseAmount = pos.entryPrice * pos.quantity;
          const marketValue = pos.currentPrice * pos.quantity;
          const pl = pos.valuationPL ?? 0;
          const plPercent =
            purchaseAmount !== 0 ? (pl / purchaseAmount) * 100 : 0;
          const isPositive = pl >= 0;

          return (
            <div
              key={pos.id}
              className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm"
            >
              <div className="flex justify-between items-start mb-2 pb-2 border-b border-gray-50">
                <div>
                  <Link
                    href={`/stock?code=${pos.code}`}
                    className="font-bold text-sm text-gray-800 hover:text-blue-600 transition-colors block"
                  >
                    {pos.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Link
                      href={`/stock?code=${pos.code}`}
                      className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      {pos.code}
                    </Link>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                      {pos.accountName}
                    </span>
                  </div>
                </div>
                <div
                  className={`text-right ${isPositive ? "text-red-500" : "text-blue-500"}`}
                >
                  <div className="font-bold text-sm">
                    {isPositive ? "+" : ""}
                    {pl.toLocaleString()}
                  </div>
                  <div className="text-[10px]">
                    ({isPositive ? "+" : ""}
                    {plPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>現在値</span>
                  <span className="text-gray-700">
                    {pos.currentPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>取得単価</span>
                  <span className="text-gray-700">
                    {pos.entryPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>保有株数</span>
                  <span className="text-gray-700">
                    {pos.quantity.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>評価額</span>
                  <span className="text-gray-700">
                    {marketValue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
