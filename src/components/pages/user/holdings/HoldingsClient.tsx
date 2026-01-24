"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Search, PanelLeft } from "lucide-react";
import OpenPositionsTable from "./OpenPositionsTable";
import { useHoldingsData } from "@/hooks/useHoldingsData";

type Props = {
  user: User;
  onToggleSidebar?: () => void;
};

// Re-export types from hook
export type { Position, ClosedTrade } from "@/hooks/useHoldingsData";

export default function HoldingsClient({ user, onToggleSidebar }: Props) {
  const { positions, closedTrades } = useHoldingsData(user.id);

  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const [filterText, setFilterText] = useState("");
  const [startDate, setStartDate] = useState(formatDate(oneYearAgo));
  const [endDate, setEndDate] = useState(formatDate(today));
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);

    if (newStartDate) {
      const [y, m, d] = newStartDate.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      date.setFullYear(date.getFullYear() + 1);
      setEndDate(formatDate(date));
    }
  };

  // Summary Calculations
  const totalInvestment = positions.reduce(
    (sum, p) => sum + p.entryPrice * p.quantity,
    0,
  );
  const currentMarketValue = positions.reduce(
    (sum, p) => sum + p.currentPrice * p.quantity,
    0,
  );
  const totalUnrealizedPL = currentMarketValue - totalInvestment;
  const totalUnrealizedPLPercent = totalInvestment
    ? (totalUnrealizedPL / totalInvestment) * 100
    : 0;

  const totalRealizedPL = closedTrades.reduce(
    (sum, t) => sum + (t.realizedPL ?? 0),
    0,
  );

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="mt-1 p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <PanelLeft size={24} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              保有銘柄 (Open Positions)
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              現在の保有資産の評価額を確認できます。
            </p>
          </div>
        </div>
      </div>
      {/* Filter */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-end gap-6 w-full lg:w-auto">
          {/* 日付範囲指定 */}
          <div className="flex items-center gap-2">
            <div>
              <label className="text-xs text-slate-500 block mb-1 font-medium">
                Entry日 (開始)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={handleStartDateChange}
                className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
              />
            </div>
            <span className="text-slate-400 mb-1">~</span>
            <div>
              <label className="text-xs text-slate-500 block mb-1 font-medium">
                Entry日 (終了)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-600"
              />
            </div>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="銘柄名・コードで検索..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="md:bg-white md:rounded-xl md:shadow-sm md:border md:border-slate-200">
        <OpenPositionsTable
          filterText={filterText}
          positions={positions}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    </div>
  );
}
