"use client";

import { useState, useMemo, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Search, PanelLeft } from "lucide-react";
import OpenPositionsTable from "./OpenPositionsTable";
import {
  fetchTransactions,
  type TransactionWithDetails,
} from "@/services/transactions";
import { fetchMultipleStockDetails } from "@/lib/stockApi";

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
  valuationPL?: number;
  entryType?: string;
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
  realizedPL?: number;
  exitType?: string;
  entryType?: string;
};

export default function HoldingsClient({ user, onToggleSidebar }: Props) {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>(
    [],
  );
  const [prices, setPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadTransactions = async () => {
      if (!user.id) return;
      try {
        const data = await fetchTransactions(user.id);
        setTransactions(data);
      } catch (error) {
        console.error("Failed to fetch transactions", error);
      }
    };
    loadTransactions();
  }, [user.id]);

  // Process transactions to build positions and history
  const { positions: basePositions, closedTrades } = useMemo(() => {
    const sorted = [...transactions].sort(
      (a, b) =>
        new Date(a.transaction_date).getTime() -
        new Date(b.transaction_date).getTime(),
    );

    type Lot = {
      date: string;
      price: number;
      quantity: number;
      accountName: string;
      stockName: string;
      type: "LONG" | "SHORT";
      entryType: string;
    };

    const openLots: Record<string, Lot[]> = {};
    const closed: ClosedTrade[] = [];
    const current: Position[] = [];

    sorted.forEach((t) => {
      // 証券コードがない取引（入出金、源泉徴収など）はポジション管理の対象外
      if (!t.stock_code) return;

      if (
        ![
          "BUY",
          "SELL",
          "CREDIT_OPEN",
          "CREDIT_CLOSE",
          "STOCK_SPLIT",
          "STOCK_MERGE",
          "STOCK_TRANSFER_IN",
          "STOCK_TRANSFER_OUT",
        ].includes(t.transaction_type as string)
      ) {
        return;
      }

      const key = `${t.account_id}-${t.stock_code}`;
      if (!openLots[key]) openLots[key] = [];

      const isLongEntry =
        t.transaction_type === "BUY" ||
        (t.transaction_type as string) === "STOCK_SPLIT" ||
        (t.transaction_type as string) === "STOCK_TRANSFER_IN";
      const isShortEntry = t.transaction_type === "CREDIT_OPEN"; // Assuming CREDIT_OPEN is Short Sell
      const isLongExit =
        t.transaction_type === "SELL" ||
        (t.transaction_type as string) === "STOCK_MERGE" ||
        (t.transaction_type as string) === "STOCK_TRANSFER_OUT";
      const isShortExit = t.transaction_type === "CREDIT_CLOSE"; // Assuming CREDIT_CLOSE is Buy to Cover

      if (isLongEntry || isShortEntry) {
        openLots[key].push({
          date: t.transaction_date,
          price: t.unit_price || 0,
          quantity: t.quantity || 0,
          accountName: t.account_name || "",
          stockName: t.stock_name || "",
          type: isLongEntry ? "LONG" : "SHORT",
          entryType: t.transaction_type,
        });
      } else if (isLongExit || isShortExit) {
        let remainingQty = t.quantity || 0;
        const targetType = isLongExit ? "LONG" : "SHORT";

        // Consume lots FIFO
        while (remainingQty > 0) {
          // Find first matching lot
          const lotIndex = openLots[key].findIndex(
            (l) => l.type === targetType,
          );
          if (lotIndex === -1) break; // No matching open position found

          const lot = openLots[key][lotIndex];
          const consume = Math.min(remainingQty, lot.quantity);
          const exitPrice = t.unit_price || 0;

          // Calculate PL
          // Long: (Exit - Entry) * Qty
          // Short: (Entry - Exit) * Qty
          const plPerShare =
            lot.type === "LONG" ? exitPrice - lot.price : lot.price - exitPrice;

          // 出庫・併合の場合は損益を計上しない（0とする）か、
          // 必要に応じて計算ロジックを変える。ここでは0として扱う。
          const realizedPL = ["STOCK_MERGE", "STOCK_TRANSFER_OUT"].includes(
            t.transaction_type as string,
          )
            ? 0
            : plPerShare * consume;

          closed.push({
            id: `${t.id}-${lot.date}-${remainingQty}`,
            code: t.stock_code || "",
            name: t.stock_name || lot.stockName,
            accountName: t.account_name || lot.accountName,
            quantity: consume,
            entryDate: lot.date,
            entryPrice: lot.price,
            exitDate: t.transaction_date,
            exitPrice: exitPrice,
            realizedPL: realizedPL,
            exitType: t.transaction_type,
            entryType: lot.entryType,
          });

          lot.quantity -= consume;
          remainingQty -= consume;

          if (lot.quantity <= 0) {
            openLots[key].splice(lotIndex, 1);
          }
        }
      }
    });

    // Convert remaining lots to Positions
    Object.entries(openLots).forEach(([key, lots]) => {
      const [, code] = key.split("-");
      lots.forEach((lot, index) => {
        if (lot.quantity > 0) {
          // Placeholder for current price (using entry price as we don't have live data)
          const currentPrice = lot.price;
          const plPerShare =
            lot.type === "LONG"
              ? currentPrice - lot.price
              : lot.price - currentPrice;

          current.push({
            id: `pos-${key}-${index}`,
            code: code,
            name: lot.stockName,
            accountName: lot.accountName,
            quantity: lot.quantity,
            entryDate: lot.date,
            entryPrice: lot.price,
            currentPrice: currentPrice,
            valuationPL: plPerShare * lot.quantity,
            entryType: lot.entryType,
          });
        }
      });
    });

    return { positions: current, closedTrades: closed };
  }, [transactions]);

  // Fetch current prices for open positions
  useEffect(() => {
    if (basePositions.length === 0) return;

    const codes = Array.from(new Set(basePositions.map((p) => p.code)));
    const loadPrices = async () => {
      try {
        const details = await fetchMultipleStockDetails(codes);
        const newPrices: Record<string, number> = {};
        Object.entries(details).forEach(([code, d]) => {
          if (d && d.current_price) {
            newPrices[code] = d.current_price;
          }
        });
        setPrices(newPrices);
      } catch (error) {
        console.error("Failed to fetch stock prices", error);
      }
    };

    loadPrices();
  }, [basePositions]);

  const positions = useMemo(() => {
    return basePositions.map((p) => {
      const currentPrice = prices[p.code] ?? p.entryPrice;
      const isShort = p.entryType === "CREDIT_OPEN";
      const plPerShare = isShort
        ? p.entryPrice - currentPrice
        : currentPrice - p.entryPrice;
      return {
        ...p,
        currentPrice,
        valuationPL: plPerShare * p.quantity,
      };
    });
  }, [basePositions, prices]);

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
