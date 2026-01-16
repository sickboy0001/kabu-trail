"use client";

import { useState, useEffect, useRef } from "react";
import StockChart from "@/components/pages/chart/StockChart";
import { User } from "@supabase/supabase-js";
import { Search } from "lucide-react";
import { toast } from "sonner";
import {
  searchStocks,
  recordStockViewHistory,
  getRecentStockViews,
  type StockInfo,
} from "@/services/stocks";
import StockDetailInfo from "@/components/pages/user/stock/StockDetailInfo";

type Props = {
  user: User;
  initialCode?: string;
};

export default function UserStockClient({ user, initialCode }: Props) {
  const defaultCode = initialCode || "7203";
  // 表示中の銘柄コード
  const [code, setCode] = useState(defaultCode);
  // 検索フォームの状態
  const [query, setQuery] = useState(defaultCode);
  const [suggestions, setSuggestions] = useState<StockInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentStocks, setRecentStocks] = useState<StockInfo[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      setQuery(initialCode);
    }
  }, [initialCode]);

  // 履歴を取得する関数
  const fetchHistory = async () => {
    if (user.id) {
      const history = await getRecentStockViews(user.id, 10);
      setRecentStocks(history);
    }
  };

  // 銘柄コードが変更されたら参照履歴を記録し、履歴リストを更新
  useEffect(() => {
    const updateHistory = async () => {
      if (code && user.id) {
        await recordStockViewHistory(user.id, code);
        await fetchHistory();
      }
    };
    updateHistory();
  }, [code, user.id]);

  // クリック外で検索結果を閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);

    if (value.length >= 1) {
      try {
        const results = await searchStocks(value);
        setSuggestions(results);
      } catch (error) {
        console.error("Stock search failed", error);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = (stock: StockInfo) => {
    setCode(stock.code);
    setQuery(`${stock.code} ${stock.name}`);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleInputKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0 && showSuggestions) {
        const firstItem = listRef.current?.firstElementChild as HTMLElement;
        firstItem?.focus();
      } else if (query.trim()) {
        // 直接入力での検索実行（存在チェック）
        setIsValidating(true);
        try {
          const results = await searchStocks(query.trim());
          if (results.length > 0) {
            // 完全一致があればそれを、なければ先頭の候補を採用
            const match =
              results.find((r) => r.code === query.trim()) || results[0];
            handleSelect(match);
          } else {
            toast.error("該当する銘柄が見つかりませんでした");
          }
        } finally {
          setIsValidating(false);
        }
      }
    }
  };

  const handleItemKeyDown = (
    e: React.KeyboardEvent<HTMLLIElement>,
    stock: StockInfo,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(stock);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = e.currentTarget.nextElementSibling as HTMLElement;
      next?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = e.currentTarget.previousElementSibling as HTMLElement;
      if (prev) {
        prev.focus();
      } else {
        inputRef.current?.focus();
      }
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="relative w-full max-w-md shrink-0" ref={containerRef}>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleSearchChange}
              onKeyDown={handleInputKeyDown}
              onFocus={() => setShowSuggestions(true)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="銘柄コードまたは名称で検索..."
            />
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <ul className="py-1" ref={listRef}>
                {suggestions.map((stock) => (
                  <li
                    key={stock.code}
                    tabIndex={0}
                    onClick={() => handleSelect(stock)}
                    onKeyDown={(e) => handleItemKeyDown(e, stock)}
                    className="px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none cursor-pointer transition-colors"
                  >
                    <div className="font-medium text-slate-800">
                      {stock.name}
                    </div>
                    <div className="text-xs text-slate-500">{stock.code}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {recentStocks.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
              最近:
            </span>
            {recentStocks.map((s) => (
              <button
                key={s.code}
                onClick={() => handleSelect(s)}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors border border-slate-200"
              >
                [{s.code}] {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {isValidating ? (
        <div className="flex justify-center py-20 text-slate-400">
          読み込み中...
        </div>
      ) : (
        <>
          <StockDetailInfo code={code} user={user} />
          <StockChart code={code} />
        </>
      )}
    </div>
  );
}
