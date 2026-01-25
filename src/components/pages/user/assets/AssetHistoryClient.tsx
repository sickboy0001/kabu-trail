"use client";

import { useState, useEffect, useMemo } from "react";
import { User } from "@supabase/supabase-js";
import { Search, Info } from "lucide-react";
import { useTransactionData } from "@/hooks/useTransactionData";
import { fetchBrokerAccounts, type BrokerAccount } from "@/services/account";
import AccountFilter from "@/components/Organisms/AccountFilter";
import { AssetHistoryList } from "./AssetHistoryList";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MarkdownTooltip } from "@/components/ui/MarkdownTooltip";
import {
  VALUATION_TOOLTIP_MD,
  PL_TOOLTIP_MD,
  PL_PERCENT_TOOLTIP_MD,
} from "@/constants/content";

type Props = {
  user: User;
};

export default function AssetHistoryClient({ user }: Props) {
  const { transactions } = useTransactionData(user.id);

  const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [filterText, setFilterText] = useState("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    if (user.id) {
      fetchBrokerAccounts(user.id).then(setBrokerAccounts);
    }
  }, [user.id]);

  // 口座リストの生成
  const accounts = useMemo(() => {
    const uniqueNames = new Set<string>();
    transactions.forEach((t) => {
      const bId = t.bucketId || (t as any).account_id || (t as any).bucket_id;
      const acc = brokerAccounts.find((a) => String(a.id) === String(bId));
      if (acc) uniqueNames.add(acc.name);
      else if (bId) uniqueNames.add(String(bId));
    });

    return Array.from(uniqueNames).sort((a, b) => {
      const accA = brokerAccounts.find((acc) => acc.name === a);
      const accB = brokerAccounts.find((acc) => acc.name === b);
      const orderA = Number((accA as any)?.sort_order ?? 9999);
      const orderB = Number((accB as any)?.sort_order ?? 9999);
      return orderA - orderB || String(a).localeCompare(String(b));
    });
  }, [transactions, brokerAccounts]);

  // データが存在する年のリスト
  const availableYears = useMemo(() => {
    const years = new Set<string>();

    let data = transactions;
    if (selectedAccounts.length > 0) {
      data = data.filter((t) => {
        const bId = t.bucketId || (t as any).account_id || (t as any).bucket_id;
        const acc = brokerAccounts.find((a) => String(a.id) === String(bId));
        const name = acc ? acc.name : bId;
        return selectedAccounts.includes(name);
      });
    }

    data.forEach((t) => {
      const dateStr = t.transactionDate || (t as any).transaction_date;
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          years.add(String(date.getFullYear()));
        }
      }
    });
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [transactions, selectedAccounts, brokerAccounts]);

  // データが存在する月のリスト
  const availableMonths = useMemo(() => {
    if (!selectedYear) return [];
    const months = new Set<string>();

    let data = transactions;
    if (selectedAccounts.length > 0) {
      data = data.filter((t) => {
        const bId = t.bucketId || (t as any).account_id || (t as any).bucket_id;
        const acc = brokerAccounts.find((a) => String(a.id) === String(bId));
        const name = acc ? acc.name : bId;
        return selectedAccounts.includes(name);
      });
    }

    data.forEach((t) => {
      const dateStr = t.transactionDate || (t as any).transaction_date;
      if (dateStr) {
        const date = new Date(dateStr);
        if (
          !isNaN(date.getTime()) &&
          String(date.getFullYear()) === selectedYear
        ) {
          months.add(String(date.getMonth() + 1));
        }
      }
    });
    return Array.from(months).sort((a, b) => Number(a) - Number(b));
  }, [transactions, selectedAccounts, brokerAccounts, selectedYear]);

  const filteredTransactions = useMemo(() => {
    let data = [...transactions];

    // 不要な取引タイプを除外
    data = data.filter((item: any) => {
      const type =
        item.type || item.transactionType || item.transaction_type || "";

      if (type === "STOCK_SPLIT" || type === "STOCK_MERGE") {
        return false;
      }
      return true;
    });

    // 口座フィルタ
    if (selectedAccounts.length > 0) {
      data = data.filter((t) => {
        const bId = t.bucketId || (t as any).account_id || (t as any).bucket_id;
        const acc = brokerAccounts.find((a) => String(a.id) === String(bId));
        const name = acc ? acc.name : bId;
        return selectedAccounts.includes(name);
      });
    }

    // 年フィルタ
    if (selectedYear) {
      data = data.filter((item: any) => {
        const dateStr = item.transactionDate || item.transaction_date;
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return String(date.getFullYear()) === selectedYear;
      });
    }

    // 月フィルタ
    if (selectedYear && selectedMonth) {
      data = data.filter((item: any) => {
        const dateStr = item.transactionDate || item.transaction_date;
        if (!dateStr) return false;
        const date = new Date(dateStr);
        return String(date.getMonth() + 1) === selectedMonth;
      });
    }

    // テキストフィルタ
    if (filterText) {
      const search = filterText.toLowerCase();
      data = data.filter((item: any) => {
        const date = item.transactionDate || item.transaction_date || "";
        const memo = item.memo || item.description || "";
        const code = item.stockCode || item.stock_code || "";
        const type =
          item.type || item.transactionType || item.transaction_type || "";

        return (
          date.toLowerCase().includes(search) ||
          memo.toLowerCase().includes(search) ||
          code.toLowerCase().includes(search) ||
          type.toLowerCase().includes(search)
        );
      });
    }

    // 日付昇順ソート
    return data.sort((a: any, b: any) => {
      const tA = a.transactionDate || a.transaction_date;
      const tB = b.transactionDate || b.transaction_date;
      const dateA = tA ? new Date(tA).getTime() : 0;
      const dateB = tB ? new Date(tB).getTime() : 0;
      return dateA - dateB || (a.id || 0) - (b.id || 0);
    });
  }, [
    transactions,
    selectedAccounts,
    filterText,
    brokerAccounts,
    selectedYear,
    selectedMonth,
  ]);

  let runningBalance = 0;
  const displayHistory = filteredTransactions.map((item: any) => {
    runningBalance += item.amount;
    return { ...item, calculatedBalance: runningBalance };
  });

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">資産推移</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TooltipProvider>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-slate-500">
                株式評価額
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info
                    size={14}
                    className="text-slate-400 cursor-pointer hover:text-slate-600"
                  />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm p-4">
                  <MarkdownTooltip
                    content={VALUATION_TOOLTIP_MD}
                    className="text-sm"
                  />
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-2xl font-bold text-slate-800">-</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-slate-500">
                評価損益
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info
                    size={14}
                    className="text-slate-400 cursor-pointer hover:text-slate-600"
                  />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm p-4">
                  <MarkdownTooltip
                    content={PL_TOOLTIP_MD}
                    className="text-sm"
                  />
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-2xl font-bold text-slate-800">-</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-slate-500">損益率</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info
                    size={14}
                    className="text-slate-400 cursor-pointer hover:text-slate-600"
                  />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm p-4">
                  <MarkdownTooltip
                    content={PL_PERCENT_TOOLTIP_MD}
                    className="text-sm"
                  />
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-2xl font-bold text-slate-800">-</div>
          </div>
        </TooltipProvider>
      </div>

      {/* フィルタエリア */}
      <div className="flex flex-col lg:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-col gap-4 w-full lg:w-auto">
          <AccountFilter
            accounts={accounts}
            selectedAccounts={selectedAccounts}
            onChange={setSelectedAccounts}
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-2">
              対象年
            </span>
            <button
              onClick={() => {
                setSelectedYear("");
                setSelectedMonth("");
              }}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                selectedYear === ""
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
              }`}
            >
              全期間
            </button>
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => {
                  setSelectedYear(year);
                  setSelectedMonth("");
                }}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedYear === year
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                }`}
              >
                {year}年
              </button>
            ))}
          </div>

          {selectedYear && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs font-bold text-slate-500 mr-2">
                対象月
              </span>
              <button
                onClick={() => setSelectedMonth("")}
                className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                  selectedMonth === ""
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                }`}
              >
                すべて
              </button>
              {availableMonths.map((month) => (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(month)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    selectedMonth === month
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {month}月
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="検索..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 金銭残高明細 */}
      <div className="pt-4 border-t border-slate-200">
        <AssetHistoryList
          data={displayHistory}
          brokerAccounts={brokerAccounts}
        />
      </div>
    </div>
  );
}
