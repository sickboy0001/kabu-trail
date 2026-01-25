import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Widget } from "../DashboardClient";
import { AccountTransaction } from "@/hooks/useTransactionData";

type Props = {
  widget: Widget;
  transactions?: AccountTransaction[];
};

export function AssetHistory({ widget, transactions = [] }: Props) {
  const [offset, setOffset] = useState(0);
  const months = widget.settings.months ?? 12;

  const data = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    // 設定された口座でフィルタリング（設定がない、または空の場合は全て表示）
    const targetBuckets = widget.settings.targetBuckets as string[] | undefined;
    const filteredTransactions =
      targetBuckets && targetBuckets.length > 0
        ? transactions.filter((t) => targetBuckets.includes(t.bucketId))
        : transactions;

    // 日付でソート
    const sorted = [...filteredTransactions].sort(
      (a, b) =>
        new Date(a.transactionDate).getTime() -
        new Date(b.transactionDate).getTime(),
    );

    const today = new Date();
    const baseDateType = widget.settings.baseDateType ?? "current";

    // 基準月の決定
    let baseDate = new Date(today.getFullYear(), today.getMonth(), 1);
    if (baseDateType === "prev_year_end") {
      baseDate = new Date(today.getFullYear() - 1, 11, 1);
    } else if (baseDateType === "this_year_end") {
      baseDate = new Date(today.getFullYear(), 11, 1);
    }

    // オフセットを適用
    baseDate.setMonth(baseDate.getMonth() + offset);

    const result = [];
    let prevYear = 0;

    // 過去Nヶ月分を生成
    // まず、表示期間の開始時点での残高を計算
    const startDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth() - (months - 1),
      1,
    );

    let currentBalance = sorted
      .filter((t) => new Date(t.transactionDate) < startDate)
      .reduce((sum, t) => sum + t.amount, 0);

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

      // 対象月の変動額を集計
      const monthlyChange = sorted
        .filter((t) => {
          const d = new Date(t.transactionDate);
          return d >= targetMonth && d < nextMonth;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      currentBalance += monthlyChange;

      result.push({
        month: axisLabel,
        fullDate: `${currentYear}年${currentMonth}月`,
        value: currentBalance,
      });
    }

    return result;
  }, [
    transactions,
    widget.settings.targetBuckets,
    widget.settings.months,
    months,
    widget.settings.baseDateType,
    offset,
  ]);

  const periodLabel = useMemo(() => {
    if (data.length === 0) return "";
    const start = data[0].fullDate;
    const end = data[data.length - 1].fullDate;
    return `${start}～${end}`;
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
        データなし
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-50 flex flex-col">
      <div className="flex items-center gap-4 mb-2 border-b border-gray-100 pb-1">
        <h3 className="text-xs sm:text-sm font-bold text-gray-500">
          {widget.title}
        </h3>
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
                      <p className="flex justify-between gap-4">
                        <span className="text-gray-300">資産額</span>
                        <span className="text-blue-400">
                          {Number(data.value).toLocaleString()}円
                        </span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="value"
              fill="#60a5fa"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
