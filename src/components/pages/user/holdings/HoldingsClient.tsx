"use client";

import { useState, useEffect, useMemo } from "react";
import { User } from "@supabase/supabase-js";
import { Search, PanelLeft } from "lucide-react";
import OpenPositionsTable from "./OpenPositionsTable";
import { useHoldingsData } from "@/hooks/useHoldingsData";
import AccountFilter from "@/components/Organisms/AccountFilter";
import { fetchBrokerAccounts, type BrokerAccount } from "@/services/account";

type Props = {
  user: User;
  onToggleSidebar?: () => void;
};

// Re-export types from hook
export type { Position, ClosedTrade } from "@/hooks/useHoldingsData";

export default function HoldingsClient({ user, onToggleSidebar }: Props) {
  const { positions, closedTrades } = useHoldingsData(user.id);

  const [filterText, setFilterText] = useState("");
  const [activeTab, setActiveTab] = useState<"open" | "closed">("open");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccount[]>([]);

  useEffect(() => {
    if (user.id) {
      fetchBrokerAccounts(user.id).then(setBrokerAccounts);
    }
  }, [user.id]);

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

  const accounts = useMemo(() => {
    const uniqueAccounts = Array.from(
      new Set(positions.map((p) => p.accountName)),
    );
    return uniqueAccounts.sort((a, b) => {
      const accA = brokerAccounts.find((acc) => acc.name === a);
      const accB = brokerAccounts.find((acc) => acc.name === b);
      const orderA = Number((accA as any)?.sort_order ?? 9999);
      const orderB = Number((accB as any)?.sort_order ?? 9999);
      return orderA - orderB || a.localeCompare(b);
    });
  }, [positions, brokerAccounts]);

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
          <AccountFilter
            accounts={accounts}
            selectedAccounts={selectedAccounts}
            onChange={setSelectedAccounts}
          />
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
          selectedAccounts={selectedAccounts}
        />
      </div>
    </div>
  );
}
