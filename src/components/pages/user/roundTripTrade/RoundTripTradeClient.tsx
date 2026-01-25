"use client";

import { useState, useMemo, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Search, PanelLeft, List, Table as TableIcon } from "lucide-react";
import RoundTripTradeTable from "./RoundTripTradeTable";
import {
  fetchTransactions,
  type TransactionWithDetails,
} from "@/services/transactions";
import { fetchMultipleStockDetails } from "@/lib/stockApi";
import { fetchBrokerAccounts, type BrokerAccount } from "@/services/account";
import AccountFilter from "@/components/Organisms/AccountFilter";

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

export default function RoundTripTradeClient({ user, onToggleSidebar }: Props) {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>(
    [],
  );
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccount[]>([]);

  useEffect(() => {
    if (user.id) {
      fetchBrokerAccounts(user.id).then(setBrokerAccounts);
    }
  }, [user.id]);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!user.id) return;
      try {
        const data = await fetchTransactions(user.id);
        // この画面で扱う取引種別のみに絞り込む (配当金などを除外)
        const allowedTypes = new Set([
          "BUY",
          "SELL",
          "CREDIT_OPEN",
          "CREDIT_CLOSE",
          "STOCK_SPLIT",
          "STOCK_MERGE",
          "STOCK_TRANSFER_IN",
          "STOCK_TRANSFER_OUT",
        ]);
        const filteredData = data.filter((t) =>
          allowedTypes.has(t.transaction_type as string),
        );
        setTransactions(filteredData);
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

          const isMerge = (t.transaction_type as string) === "STOCK_MERGE";

          if (!isMerge) {
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
          }

          if (isMerge) {
            const totalCost = lot.price * lot.quantity;
            const newQuantity = lot.quantity - consume;
            if (newQuantity > 0) {
              lot.price = totalCost / newQuantity;
            }
          }

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

  // Group closedTrades into Cycles (Entry to Exit = 0)
  const tradeCycles = useMemo(() => {
    if (closedTrades.length === 0) return [];

    const groups: Record<string, ClosedTrade[]> = {};
    closedTrades.forEach((t) => {
      const key = `${t.accountName}-${t.code}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    const cycles: ClosedTrade[] = [];

    Object.values(groups).forEach((groupTrades) => {
      // Sort by Entry Date
      groupTrades.sort((a, b) => {
        const dateDiff =
          new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
        if (dateDiff !== 0) return dateDiff;
        return a.id.localeCompare(b.id);
      });

      if (groupTrades.length === 0) return;

      let currentCycle: ClosedTrade[] = [groupTrades[0]];
      let cycleEndTime = new Date(groupTrades[0].exitDate).getTime();

      for (let i = 1; i < groupTrades.length; i++) {
        const t = groupTrades[i];
        const tEntryTime = new Date(t.entryDate).getTime();
        const tExitTime = new Date(t.exitDate).getTime();

        // If entry is before or on the same day as previous exit, consider it part of the same cycle
        if (tEntryTime <= cycleEndTime) {
          currentCycle.push(t);
          if (tExitTime > cycleEndTime) {
            cycleEndTime = tExitTime;
          }
        } else {
          cycles.push(aggregateCycle(currentCycle));
          currentCycle = [t];
          cycleEndTime = tExitTime;
        }
      }
      if (currentCycle.length > 0) {
        cycles.push(aggregateCycle(currentCycle));
      }
    });

    return cycles;
  }, [closedTrades]);

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

  const [filterText, setFilterText] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const accounts = useMemo(() => {
    const uniqueAccounts = Array.from(
      new Set(tradeCycles.map((t) => t.accountName)),
    );
    return uniqueAccounts.sort((a, b) => {
      const accA = brokerAccounts.find((acc) => acc.name === a);
      const accB = brokerAccounts.find((acc) => acc.name === b);
      const orderA = Number((accA as any)?.sort_order ?? 9999);
      const orderB = Number((accB as any)?.sort_order ?? 9999);
      return orderA - orderB || a.localeCompare(b);
    });
  }, [tradeCycles, brokerAccounts]);

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
              売却済み・過去の取引(Closed Trades)
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              過去の取引による確定損益を確認できます。
            </p>
          </div>
        </div>
      </div>
      {/* Filter */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-end gap-6 w-full lg:w-auto">
          <AccountFilter
            accounts={accounts}
            selectedAccounts={selectedAccounts}
            onChange={setSelectedAccounts}
          />
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
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
      </div>
      <RoundTripTradeTable
        filterText={filterText}
        trades={tradeCycles}
        transactions={transactions}
        selectedAccounts={selectedAccounts}
      />
    </div>
  );
}

function aggregateCycle(trades: ClosedTrade[]): ClosedTrade {
  const first = trades[0];
  let lastTrade = trades[0];
  trades.forEach((t) => {
    if (t.exitDate >= lastTrade.exitDate) {
      lastTrade = t;
    }
  });

  const totalQty = trades.reduce((sum, t) => sum + t.quantity, 0);
  const totalEntryVal = trades.reduce(
    (sum, t) => sum + t.entryPrice * t.quantity,
    0,
  );
  const totalExitVal = trades.reduce(
    (sum, t) => sum + t.exitPrice * t.quantity,
    0,
  );
  const totalPL = trades.reduce((sum, t) => sum + (t.realizedPL ?? 0), 0);

  return {
    id: `cycle-${first.id}-${trades.length}`,
    code: first.code,
    name: first.name,
    accountName: first.accountName,
    quantity: totalQty,
    entryDate: first.entryDate,
    entryPrice: totalQty ? Math.round(totalEntryVal / totalQty) : 0,
    exitDate: lastTrade.exitDate,
    exitPrice: totalQty ? Math.round(totalExitVal / totalQty) : 0,
    realizedPL: totalPL,
    entryType: first.entryType,
    exitType: lastTrade.exitType,
  };
}
