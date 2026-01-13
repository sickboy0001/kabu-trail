import { useState, useRef } from "react";
import { X, Search, Plus } from "lucide-react";
import { searchStocks, type StockInfo } from "@/services/stocks";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (stock: StockInfo) => void;
};

export function AddStockModal({ isOpen, onClose, onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<StockInfo[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

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
    onAdd(stock);
    setQuery("");
    setSuggestions([]);
    onClose();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      const firstItem = listRef.current?.firstElementChild as HTMLElement;
      firstItem?.focus();
    }
  };

  const handleItemKeyDown = (
    e: React.KeyboardEvent<HTMLLIElement>,
    stock: StockInfo
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800">銘柄を追加</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleSearch}
              onKeyDown={handleInputKeyDown}
              placeholder="銘柄コードまたは名称で検索..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          <div className="mt-4 overflow-y-auto max-h-75">
            {suggestions.length > 0 ? (
              <ul className="space-y-1" ref={listRef}>
                {suggestions.map((stock) => (
                  <li
                    key={stock.code}
                    tabIndex={0}
                    onClick={() => handleSelect(stock)}
                    onKeyDown={(e) => handleItemKeyDown(e, stock)}
                    className="flex items-center justify-between p-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-lg cursor-pointer transition-colors group"
                  >
                    <div>
                      <div className="font-medium text-slate-800">
                        {stock.name}
                      </div>
                      <div className="text-xs text-slate-500">{stock.code}</div>
                    </div>
                    <button className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity bg-blue-100 p-1.5 rounded-full">
                      <Plus size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : query.length > 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                該当する銘柄が見つかりません
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-sm">
                銘柄を検索してバスケットに追加します
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
