"use client";

import { useState, useMemo } from "react";
import { User } from "@supabase/supabase-js";
import { Search, PanelLeft } from "lucide-react";
import PositionsTable from "./PositionsTable";

type Props = {
  user: User;
  onToggleSidebar?: () => void;
};

// Mock Data Types
export type Position = {
  id: string;
  code: string;
  name: string;
  accountName: string;
  quantity: number;
  entryDate: string;
  entryPrice: number;
  currentPrice: number; // Mock current price
};

export type ClosedTrade = {
  id: string;
  code: string;
  name: string;
  accountName: string;
  quantity: number;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
};

// Mock Data
const MOCK_POSITIONS: Position[] = [
  {
    id: "3",
    code: "9984",
    name: "ソフトバンクG",
    accountName: "野村",
    quantity: 100,
    entryDate: "2025-01-12",
    entryPrice: 6500,
    currentPrice: 6175,
  },
  {
    id: "5",
    code: "9101",
    name: "日本郵船",
    accountName: "野村",
    quantity: 500,
    entryDate: "2025-02-01",
    entryPrice: 1100,
    currentPrice: 1155,
  },
  {
    id: "6",
    code: "8035",
    name: "東京エレクトロン",
    accountName: "SBI",
    quantity: 100,
    entryDate: "2025-02-15",
    entryPrice: 35000,
    currentPrice: 36500,
  },
  {
    id: "7",
    code: "6861",
    name: "キーエンス",
    accountName: "楽天",
    quantity: 100,
    entryDate: "2025-03-05",
    entryPrice: 68000,
    currentPrice: 66500,
  },
  {
    id: "8",
    code: "7203",
    name: "トヨタ自動車",
    accountName: "野村",
    quantity: 200,
    entryDate: "2025-03-10",
    entryPrice: 3500,
    currentPrice: 3550,
  },
];

const MOCK_CLOSED_TRADES: ClosedTrade[] = [
  {
    id: "1",
    code: "7203",
    name: "トヨタ自動車",
    accountName: "野村",
    quantity: 100,
    entryDate: "2025-01-05",
    entryPrice: 2450,
    exitDate: "2025-01-21",
    exitPrice: 2695,
  },
  {
    id: "2",
    code: "8306",
    name: "三菱UFJフィナンシャルG",
    accountName: "野村",
    quantity: 500,
    entryDate: "2025-01-10",
    entryPrice: 980,
    exitDate: "2025-01-21",
    exitPrice: 882,
  },
  {
    id: "4",
    code: "6758",
    name: "ソニーG",
    accountName: "SBI基本",
    quantity: 5000,
    entryDate: "2025-02-01",
    entryPrice: 100,
    exitDate: "2025-03-01",
    exitPrice: 110,
  },
  {
    id: "9",
    code: "9983",
    name: "ファーストリテイリング",
    accountName: "楽天",
    quantity: 30,
    entryDate: "2025-01-15",
    entryPrice: 42000,
    exitDate: "2025-02-20",
    exitPrice: 45000,
  },
  {
    id: "10",
    code: "4063",
    name: "信越化学",
    accountName: "SBI基本",
    quantity: 200,
    entryDate: "2025-02-10",
    entryPrice: 6200,
    exitDate: "2025-03-05",
    exitPrice: 6100,
  },
  {
    id: "11",
    code: "7974",
    name: "任天堂",
    accountName: "野村",
    quantity: 100,
    entryDate: "2025-02-25",
    entryPrice: 8500,
    exitDate: "2025-03-15",
    exitPrice: 8800,
  },
];

export default function PositionsClient({ user, onToggleSidebar }: Props) {
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
  const [showOpenPositions, setShowOpenPositions] = useState(true);
  const [showClosedTrades, setShowClosedTrades] = useState(true);

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
  const totalInvestment = MOCK_POSITIONS.reduce(
    (sum, p) => sum + p.entryPrice * p.quantity,
    0
  );
  const currentMarketValue = MOCK_POSITIONS.reduce(
    (sum, p) => sum + p.currentPrice * p.quantity,
    0
  );
  const totalUnrealizedPL = currentMarketValue - totalInvestment;
  const totalUnrealizedPLPercent = (totalUnrealizedPL / totalInvestment) * 100;

  const totalRealizedPL = MOCK_CLOSED_TRADES.reduce(
    (sum, t) => sum + (t.exitPrice - t.entryPrice) * t.quantity,
    0
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
              保有銘柄・損益状況
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              現在の保有資産の評価額と、過去の取引による確定損益を確認できます。
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium mb-1">
            資産評価額合計
          </p>
          <p className="text-2xl font-bold text-slate-800">
            ¥{currentMarketValue.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 mt-2 text-sm">
            <span className="text-slate-500">
              取得額: ¥{totalInvestment.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium mb-1">
            含み損益 (評価損益)
          </p>
          <div className="flex items-baseline gap-2">
            <p
              className={`text-2xl font-bold ${
                totalUnrealizedPL >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {totalUnrealizedPL >= 0 ? "+" : ""}
              {totalUnrealizedPL.toLocaleString()}
            </p>
            <span
              className={`text-sm font-medium ${
                totalUnrealizedPL >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ({totalUnrealizedPLPercent >= 0 ? "+" : ""}
              {totalUnrealizedPLPercent.toFixed(2)}%)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            ※現在の市場価格に基づく試算
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium mb-1">
            確定損益 (実現損益)
          </p>
          <p
            className={`text-2xl font-bold ${
              totalRealizedPL >= 0 ? "text-blue-600" : "text-red-600"
            }`}
          >
            {totalRealizedPL >= 0 ? "+" : ""}
            {totalRealizedPL.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-2">※決済済み取引の累計</p>
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

          {/* 表示切り替えチェックボックス */}
          <div className="flex items-center gap-4 mb-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOpenPositions}
                onChange={(e) => setShowOpenPositions(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm text-slate-700">保有中</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showClosedTrades}
                onChange={(e) => setShowClosedTrades(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm text-slate-700">売却済</span>
            </label>
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
      {/* Table Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <PositionsTable
          filterText={filterText}
          positions={MOCK_POSITIONS}
          closedTrades={MOCK_CLOSED_TRADES}
          startDate={startDate}
          endDate={endDate}
          showOpenPositions={showOpenPositions}
          showClosedTrades={showClosedTrades}
        />
      </div>
    </div>
  );
}
