import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Widget } from "../DashboardClient";
import { ClosedTrade } from "@/hooks/useHoldingsData";

type Props = {
  widget: Widget;
  closedTrades?: ClosedTrade[];
};

export function ProfitLossHistory({ widget, closedTrades = [] }: Props) {
  const [offset, setOffset] = useState(0);
  const months = widget.settings.months ?? 12;

  const data = useMemo(() => {
    if (!closedTrades || closedTrades.length === 0) return [];

    // 設定された口座でフィルタリング（設定がない、または空の場合は全て表示）
    const targetBuckets = widget.settings.targetBuckets as string[] | undefined;
    const filteredTrades =
      targetBuckets && targetBuckets.length > 0
        ? closedTrades.filter(
            (t) => t.bucketId && targetBuckets.includes(t.bucketId),
          )
        : closedTrades;

    const today = new Date();
    const baseDateType = widget.settings.baseDateType ?? "current";

    // 基準月の決定
    let baseDate = new Date(today.getFullYear(), today.getMonth(), 1);
    if (baseDateType === "prev_year_end") {
      // 前年の12月1日
      baseDate = new Date(today.getFullYear() - 1, 11, 1);
    } else if (baseDateType === "this_year_end") {
      // 今年の12月1日
      baseDate = new Date(today.getFullYear(), 11, 1);
    }

    // オフセットを適用
    baseDate.setMonth(baseDate.getMonth() + offset);

    const result = [];
    let prevYear = 0;

    // 過去Nヶ月分を生成
    for (let i = months - 1; i >= 0; i--) {
      const targetMonth = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth() - i,
        1,
      );
      const nextMonth = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth() - i + 1,
        1,
      );

      const currentYear = targetMonth.getFullYear();
      const currentMonth = targetMonth.getMonth() + 1;

      // X軸ラベル生成: 年が変わるタイミング（または初回）だけ年を表示
      let axisLabel = `${currentMonth}月`;
      if (currentYear !== prevYear) {
        axisLabel = `${currentYear}年${currentMonth}月`;
      }
      prevYear = currentYear;

      // 対象月の確定損益を集計
      const targetTrades = filteredTrades.filter((t) => {
        const d = new Date(t.exitDate); // 決済日で判定
        return d >= targetMonth && d < nextMonth;
      });

      const monthlyPL = targetTrades.reduce(
        (sum, t) => sum + (t.realizedPL || 0),
        0,
      );

      // 銘柄ごとの損益を集計
      const stockMap = new Map<string, number>();
      targetTrades.forEach((t) => {
        const current = stockMap.get(t.name) || 0;
        stockMap.set(t.name, current + (t.realizedPL || 0));
      });

      // 損益の絶対値が大きい順にソート
      const stocks = Array.from(stockMap.entries())
        .map(([name, pl]) => ({ name, pl }))
        .sort((a, b) => Math.abs(b.pl) - Math.abs(a.pl));

      result.push({
        month: axisLabel,
        fullDate: `${currentYear}年${currentMonth}月`,
        value: monthlyPL,
        count: targetTrades.length,
        stocks,
      });
    }

    return result;
  }, [closedTrades, widget.settings, offset, months]);

  const periodLabel = useMemo(() => {
    if (data.length === 0) return "";
    const start = data[0].fullDate;
    const end = data[data.length - 1].fullDate;
    return `${start}～${end}`;
  }, [data]);

  // データが全て0の場合はデータなしとみなすことも可能だが、
  // 期間内に取引がないことを示すために0のままグラフを表示する方針とする
  const hasData = closedTrades && closedTrades.length > 0;

  if (!hasData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        データなし
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-50 flex flex-col">
      <div className="flex items-center gap-4 mb-2 border-b border-gray-100 pb-1">
        <h3 className="text-sm font-bold text-gray-500">{widget.title}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setOffset((prev) => prev - months)}
            className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <div
            className="text-[10px] text-gray-400 truncate text-center select-none"
            title={periodLabel}
          >
            {periodLabel}
          </div>
          <button
            type="button"
            onClick={() => setOffset((prev) => prev + months)}
            className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronRight size={14} />
          </button>
          <button
            type="button"
            onClick={() => setOffset(0)}
            className="p-0.5 ml-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors"
            title="現在の期間に戻る"
          >
            <Calendar size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f3f4f6"
            />
            <ReferenceLine y={0} stroke="#9ca3af" strokeWidth={1} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              dy={5}
            />
            <Tooltip
              cursor={{ fill: "#f3f4f6" }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-gray-800 text-white p-2 rounded-md text-xs shadow-lg border border-gray-700">
                      <p className="font-bold mb-1 border-b border-gray-600 pb-1">
                        {data.fullDate}
                      </p>
                      <div className="space-y-1">
                        <p className="flex justify-between gap-4">
                          <span className="text-gray-300">確定損益</span>
                          <span
                            className={
                              data.value >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {data.value >= 0 ? "+" : ""}
                            {Number(data.value).toLocaleString()}円
                          </span>
                        </p>
                        <p className="flex justify-between gap-4">
                          <span className="text-gray-300">取引件数</span>
                          <span>{data.count}件</span>
                        </p>

                        {/* 銘柄内訳の表示 */}
                        {data.stocks && data.stocks.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-600">
                            <div className="text-gray-400 mb-1 text-[10px]">
                              内訳 (上位5件)
                            </div>
                            <div className="space-y-0.5">
                              {data.stocks
                                .slice(0, 5)
                                .map((stock: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between gap-3 text-[10px]"
                                  >
                                    <span
                                      className="text-gray-300 truncate max-w-30"
                                      title={stock.name}
                                    >
                                      {stock.name}
                                    </span>
                                    <span
                                      className={
                                        stock.pl >= 0
                                          ? "text-green-400"
                                          : "text-red-400"
                                      }
                                    >
                                      {stock.pl >= 0 ? "+" : ""}
                                      {Number(stock.pl).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              {data.stocks.length > 5 && (
                                <div className="text-right text-[10px] text-gray-500">
                                  他 {data.stocks.length - 5} 件
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={40}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.value >= 0 ? "#22c55e" : "#ef4444"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
