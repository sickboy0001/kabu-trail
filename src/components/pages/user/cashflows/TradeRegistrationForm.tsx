"use client";

import { useEffect, useState, useRef } from "react";
import { fetchBrokerAccounts, type BrokerAccount } from "@/services/account";
import {
  searchStocks,
  getRecentStockViews,
  type StockInfo,
} from "@/services/stocks";
import { Search, History, Plus, Minus } from "lucide-react";
import { toast } from "sonner";
import { NumericKeypad } from "@/components/Organisms/numeric-keypad";
import { DateSelect } from "@/components/Organisms/date-select";
import {
  insertTransaction,
  updateTransaction,
  type TransactionType,
  type TransactionWithDetails,
} from "@/services/transactions";

type Props = {
  userId: string;
  onSuccess?: () => void;
  initialData?: TransactionWithDetails | null;
};

export default function TradeRegistrationForm({
  userId,
  onSuccess,
  initialData,
}: Props) {
  const [accounts, setAccounts] = useState<BrokerAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<StockInfo[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentStocks, setRecentStocks] = useState<StockInfo[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [side, setSide] = useState("");
  const [fee, setFee] = useState("");
  const [activeInput, setActiveInput] = useState<"quantity" | "price" | null>(
    null,
  );
  const [tradeDate, setTradeDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      const data = await fetchBrokerAccounts(userId);
      setAccounts(data);
      if (data.length > 0) {
        setSelectedAccountId(String(data[0].id));
      }
    };

    if (userId) fetchAccounts();
  }, [userId]);

  useEffect(() => {
    if (initialData) {
      setSelectedAccountId(String(initialData.account_id));
      setTradeDate(initialData.transaction_date);
      setQuantity(String(initialData.quantity || ""));
      setPrice(String(initialData.unit_price || ""));
      setFee(String(initialData.fee || ""));

      if (initialData.stock_code && initialData.stock_name) {
        setSelectedStock({
          code: initialData.stock_code,
          name: initialData.stock_name,
        } as StockInfo);
        setQuery(`${initialData.stock_code} ${initialData.stock_name}`);
      }

      const sideMap: Record<string, string> = {
        BUY: "cash_buy",
        SELL: "cash_sell",
        CREDIT_OPEN: "margin_open",
        CREDIT_CLOSE: "margin_close",
        STOCK_SPLIT: "stock_split",
        STOCK_MERGE: "stock_merge",
        STOCK_TRANSFER_IN: "stock_transfer_in",
        STOCK_TRANSFER_OUT: "stock_transfer_out",
      };
      if (sideMap[initialData.transaction_type]) {
        setSide(sideMap[initialData.transaction_type]);
      }
    }
  }, [initialData]);

  // クリック外で検索結果を閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(true);
    setShowHistory(false);

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
    setQuery(`${stock.code} ${stock.name}`);
    setSelectedStock(stock);
    setSuggestions([]);
    setShowSuggestions(false);
    setShowHistory(false);
  };

  const handleHistoryClick = async () => {
    if (!showHistory) {
      if (userId) {
        const history = await getRecentStockViews(userId, 10);
        setRecentStocks(history);
      }
      setShowSuggestions(false);
    }
    setShowHistory(!showHistory);
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
        const results = await searchStocks(query.trim());
        if (results.length > 0) {
          const match =
            results.find((r) => r.code === query.trim()) || results[0];
          handleSelect(match);
        } else {
          toast.error("該当する銘柄が見つかりませんでした");
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

  const adjustQuantity = (amount: number) => {
    const current = parseInt(quantity || "0", 10);
    const next = Math.max(0, current + amount);
    setQuantity(next.toString());
  };

  const adjustPrice = (amount: number) => {
    const current = parseInt(price || "0", 10);
    const next = Math.max(0, current + amount);
    setPrice(next.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isStockTransfer =
      side === "stock_split" ||
      side === "stock_merge" ||
      side === "stock_transfer_in" ||
      side === "stock_transfer_out";

    if (
      !selectedAccountId ||
      !selectedStock ||
      !side ||
      !quantity ||
      (!isStockTransfer && !price)
    ) {
      toast.error("必須項目を入力してください");
      return;
    }

    const account = accounts.find((a) => String(a.id) === selectedAccountId);
    const sideMap: Record<string, string> = {
      cash_buy: "BUY",
      cash_sell: "SELL",
      margin_open: "CREDIT_OPEN",
      margin_close: "CREDIT_CLOSE",
      stock_split: "STOCK_SPLIT",
      stock_merge: "STOCK_MERGE",
      stock_transfer_in: "STOCK_TRANSFER_IN",
      stock_transfer_out: "STOCK_TRANSFER_OUT",
    };
    const sideLabels: Record<string, string> = {
      BUY: "現物買",
      SELL: "現物売",
      CREDIT_OPEN: "信用建",
      CREDIT_CLOSE: "信用埋",
      STOCK_SPLIT: "株式分割",
      STOCK_MERGE: "株式併合",
      STOCK_TRANSFER_IN: "入庫",
      STOCK_TRANSFER_OUT: "出庫",
    };

    const dbType = sideMap[side];
    const numQuantity = Number(quantity);
    const numPrice = Number(price);
    const numFee = fee ? Number(fee) : 0;

    // 収支計算 (amount)
    // 買(BUY)・信用返済買(CREDIT_CLOSE) = 支出 (-)
    // 売(SELL)・信用新規売(CREDIT_OPEN) = 収入 (+)
    // 株式異動 = 収支なし (0)
    // ※信用取引の計算は本来複雑ですが、ここではキャッシュフローとして簡易計算します
    let calculatedAmount = 0;
    if (
      [
        "STOCK_SPLIT",
        "STOCK_MERGE",
        "STOCK_TRANSFER_IN",
        "STOCK_TRANSFER_OUT",
      ].includes(dbType)
    ) {
      calculatedAmount = 0;
    } else if (dbType === "BUY" || dbType === "CREDIT_CLOSE") {
      calculatedAmount = -(numQuantity * numPrice + numFee);
    } else {
      calculatedAmount = numQuantity * numPrice - numFee;
    }

    try {
      const payload = {
        user_id: userId,
        account_id: Number(selectedAccountId),
        stock_code: selectedStock.code,
        transaction_date: tradeDate,
        transaction_type: dbType as TransactionType,
        quantity: numQuantity,
        unit_price: numPrice,
        fee: numFee,
        amount: calculatedAmount,
        tax: 0, // 税金入力欄がないため0
        memo: "",
      };

      if (initialData) {
        await updateTransaction(initialData.id, payload);
        toast.success("取引を更新しました", {
          description: `約定日: ${tradeDate} / 口座: ${account?.name} / 銘柄: ${selectedStock.name} / 区分: ${sideLabels[dbType]} / ${quantity}株 / ${price}円`,
        });
      } else {
        await insertTransaction(payload);
        toast.success("取引を登録しました", {
          description: `約定日: ${tradeDate} / 口座: ${account?.name} / 銘柄: ${selectedStock.name} / 区分: ${sideLabels[dbType]} / ${quantity}株 / ${price}円`,
        });
      }

      setTimeout(() => {
        onSuccess?.();
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error("登録に失敗しました");
    }
  };

  return (
    <div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              取引口座
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {accounts.length === 0 && (
                <option value="">選択してください</option>
              )}
              {accounts.map((account) => {
                const info = [(account as any).brokerName, account.category]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <option key={account.id} value={account.id}>
                    {account.name}
                    {info ? ` (${info})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <div className="w-full max-w-sm">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                約定日
              </label>
              <DateSelect value={tradeDate} onChange={setTradeDate} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative" ref={containerRef}>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              銘柄コード / 銘柄名
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
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
                  onFocus={() => {
                    setShowSuggestions(true);
                    setShowHistory(false);
                  }}
                  placeholder="例: 7203 トヨタ自動車"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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
                          <div className="text-xs text-slate-500">
                            {stock.code}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleHistoryClick}
                className={`px-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-slate-600 ${
                  showHistory
                    ? "bg-slate-100 ring-2 ring-blue-500 border-blue-500"
                    : "bg-white"
                }`}
                title="履歴から選択"
              >
                <History size={20} />
              </button>
            </div>
            {showHistory && recentStocks.length > 0 && (
              <div className="absolute z-20 right-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                <div className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-100">
                  最近表示した銘柄
                </div>
                <ul className="py-1">
                  {recentStocks.map((stock) => (
                    <li
                      key={stock.code}
                      tabIndex={0}
                      onClick={() => handleSelect(stock)}
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
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              取引区分
            </label>
            <div className="flex flex-wrap gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="side"
                  checked={side === "cash_buy"}
                  onChange={() => setSide("cash_buy")}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">現物買</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="side"
                  checked={side === "cash_sell"}
                  onChange={() => setSide("cash_sell")}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-slate-700">現物売</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="side"
                  checked={side === "margin_open"}
                  onChange={() => setSide("margin_open")}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">信用建</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="side"
                  checked={side === "margin_close"}
                  onChange={() => setSide("margin_close")}
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-slate-700">信用埋</span>
              </label>
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="side"
                  checked={side === "stock_split"}
                  onChange={() => setSide("stock_split")}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-700">株式分割</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="side"
                  checked={side === "stock_merge"}
                  onChange={() => setSide("stock_merge")}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span className="text-sm text-slate-700">株式併合</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="side"
                  checked={side === "stock_transfer_in"}
                  onChange={() => setSide("stock_transfer_in")}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-slate-700">入庫・移管</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="side"
                  checked={side === "stock_transfer_out"}
                  onChange={() => setSide("stock_transfer_out")}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span className="text-sm text-slate-700">出庫・移管</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              数量 (株)
            </label>
            <div className="flex rounded-lg shadow-sm">
              <input
                type="number"
                value={quantity}
                readOnly
                onClick={() => setActiveInput("quantity")}
                placeholder="100"
                className="w-full border border-slate-300 py-2.5 px-2 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 rounded-l-lg border-r-0 cursor-pointer bg-white"
              />
              <button
                type="button"
                onClick={() => adjustQuantity(-100)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-300 border-r-0 hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                onClick={() => adjustQuantity(100)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-r-lg hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              単価 (円)
            </label>
            <div className="flex rounded-lg shadow-sm">
              <input
                type="number"
                value={price}
                readOnly
                onClick={() => setActiveInput("price")}
                placeholder="1000"
                className="w-full border border-slate-300 py-2.5 px-2 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 rounded-l-lg border-r-0 cursor-pointer bg-white"
              />
              <button
                type="button"
                onClick={() => adjustPrice(-1)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-300 border-r-0 hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <Minus size={16} />
              </button>
              <button
                type="button"
                onClick={() => adjustPrice(1)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-r-lg hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              手数料 (税込)
            </label>
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="0"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-colors w-full md:w-auto"
          >
            {initialData ? "取引を更新する" : "取引を登録する"}
          </button>
        </div>
      </form>

      {activeInput && (
        <NumericKeypad
          title={activeInput === "quantity" ? "数量を入力" : "単価を入力"}
          initialValue={activeInput === "quantity" ? quantity : price}
          allowDecimal={activeInput === "price"}
          onConfirm={(val) => {
            if (activeInput === "quantity") setQuantity(val);
            else setPrice(val);
            setActiveInput(null);
          }}
          onClose={() => setActiveInput(null)}
        />
      )}
    </div>
  );
}
