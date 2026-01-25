import React, { useMemo } from "react";
import { Widget } from "../DashboardClient";
import { Position } from "@/hooks/useHoldingsData";
import { useMarketCalendar } from "@/hooks/useMarketCalendar";

type Props = {
  widget: Widget;
  positions?: Position[];
};

export function DayOverDay({ widget, positions = [] }: Props) {
  const { getBusinessDates } = useMarketCalendar();
  const { latest, previous } = getBusinessDates();

  const { diffAmount, diffPercent } = useMemo(() => {
    const targetBuckets = widget.settings.targetBuckets as string[] | undefined;

    const filteredPositions =
      targetBuckets && targetBuckets.length > 0
        ? positions.filter(
            (p) => p.bucketId && targetBuckets.includes(p.bucketId),
          )
        : positions;

    // 現在の評価額合計
    const totalMarketValue = filteredPositions.reduce(
      (sum, p) => sum + p.currentPrice * p.quantity,
      0,
    );

    // 前日（営業日基準）の評価額合計
    const totalPrevMarketValue = filteredPositions.reduce((sum, p) => {
      // previousClose (前日終値) があると想定
      const prevPrice = p.previousClose ?? p.currentPrice;
      return sum + prevPrice * p.quantity;
    }, 0);

    const diffAmount = totalMarketValue - totalPrevMarketValue;

    // 前日比率
    const percent =
      totalPrevMarketValue !== 0
        ? (diffAmount / totalPrevMarketValue) * 100
        : 0;

    return { diffAmount, diffPercent: percent };
  }, [positions, widget.settings.targetBuckets]);

  const isPositive = diffAmount >= 0;

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
    }
    return dateStr;
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xs sm:text-sm font-bold text-gray-500 mb-2 border-b border-gray-100 pb-1">
        {widget.title}
      </h3>
      <div className="flex flex-col justify-center flex-1 gap-1 px-2">
        {/* メイン: 前日比額 */}
        <div>
          <div className="text-xs text-gray-500 mb-1">前日比</div>
          <div
            className={`text-2xl font-bold tracking-tight ${isPositive ? "text-red-500" : "text-blue-500"}`}
          >
            {isPositive ? "+" : ""}
            {diffAmount.toLocaleString()}
            <span className="text-sm font-normal ml-1 text-gray-500">円</span>
          </div>
        </div>

        {/* サブ: 詳細リスト */}
        <div className="flex flex-col gap-1 border-t border-gray-100 pt-1">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center text-sm">
            <span className="text-gray-500">前日比率</span>
            <span
              className={`font-bold self-end sm:self-auto ${isPositive ? "text-red-500" : "text-blue-500"}`}
            >
              {isPositive ? "▲" : "▼"} {Math.abs(diffPercent).toFixed(2)}%
            </span>
          </div>
          <div className="text-xs text-gray-400 text-right">
            {latest && previous
              ? `※${formatDate(previous)} vs ${formatDate(latest)}`
              : "※前日終値との比較"}
          </div>
        </div>
      </div>
    </div>
  );
}
