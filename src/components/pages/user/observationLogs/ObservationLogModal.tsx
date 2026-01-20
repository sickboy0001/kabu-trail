import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { X, Save } from "lucide-react";
import { searchStocks, type StockInfo } from "@/services/stocks";

// 今日の日付をYYYY-MM-DD形式で取得するヘルパー
const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

export type ObservationLogFormData = {
  id: number;
  date: string;
  content: string;
  stocks: string[];
  tags: string[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ObservationLogFormData) => void;
  initialData: {
    id: number;
    date: string;
    content: string;
    stocks: StockInfo[];
    tags: string[];
  } | null;
  initialStocks?: StockInfo[];
};

export function ObservationLogModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  initialStocks,
}: Props) {
  const [date, setDate] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [stockInput, setStockInput] = useState({ code: "", name: "" });
  const [suggestions, setSuggestions] = useState<StockInfo[]>([]);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(initialData.date.replace(/\//g, "-"));
        setContent(initialData.content);
        setTags(initialData.tags.join(" "));
        setStocks(initialData.stocks);
      } else {
        setDate(getTodayString());
        setContent("");
        setTags("");
        setStocks(initialStocks || []);
      }
      setStockInput({ code: "", name: "" });
      setSuggestions([]);
    }
  }, [isOpen, initialData, initialStocks]);

  const handleRemoveStock = (indexToRemove: number) => {
    setStocks(stocks.filter((_, index) => index !== indexToRemove));
  };

  // 銘柄名入力時の検索処理
  const handleNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 入力値が変わったらコードの紐付けは解除して検索モードにする
    setStockInput({ code: "", name: value });

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

  // 入力欄でのキー操作（Enterでリストへフォーカス移動）
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (suggestions.length > 0) {
        e.preventDefault();
        // サジェストリストの最初の項目にフォーカスを移動
        const firstItem = suggestionsRef.current
          ?.firstElementChild as HTMLElement;
        firstItem?.focus();
      } else if (!stockInput.name) {
        e.preventDefault();
        contentRef.current?.focus();
      }
    }
  };

  // サジェストリスト項目でのキー操作
  const handleSuggestionKeyDown = (
    e: React.KeyboardEvent<HTMLLIElement>,
    stock: StockInfo,
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSelectStock(stock);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = e.currentTarget.nextElementSibling as HTMLElement;
      next?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = e.currentTarget.previousElementSibling as HTMLElement;
      prev?.focus();
    }
  };

  // サジェスト選択時の処理
  const handleSelectStock = (stock: StockInfo) => {
    if (!stocks.some((s) => s.code === stock.code)) {
      setStocks([...stocks, stock]);
    }
    setStockInput({ code: "", name: "" });
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleSave = () => {
    if (!content) return;

    const tagList = tags
      .split(/[\s,]+/)
      .filter((t) => t.trim() !== "")
      .map((t) => t.trim());

    onSave({
      id: initialData?.id || 0,
      date,
      content,
      stocks: stocks.map((s) => s.code),
      tags: tagList,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800">
            {initialData ? "メモを編集" : "新規メモ作成"}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="flex gap-4 items-start">
            {/* 日付入力 */}
            <div className="space-y-2 w-40 shrink-0">
              <label className="text-sm font-medium text-slate-700">日付</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 銘柄入力エリア */}
            <div className="space-y-2 flex-1 min-w-0">
              <label className="text-sm font-medium text-slate-700">
                関連銘柄
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="銘柄名またはコード (例: トヨタ, 7203)"
                    value={stockInput.name}
                    onChange={handleNameChange}
                    onKeyDown={handleInputKeyDown}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {/* サジェストリスト */}
                  {suggestions.length > 0 && (
                    <ul
                      ref={suggestionsRef}
                      className="absolute z-10 w-full bg-white border border-slate-200 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto"
                    >
                      {suggestions.map((s) => (
                        <li
                          key={s.code}
                          tabIndex={0}
                          onClick={() => handleSelectStock(s)}
                          onKeyDown={(e) => handleSuggestionKeyDown(e, s)}
                          className="px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none cursor-pointer text-sm flex justify-between items-center"
                        >
                          <span className="font-medium text-slate-700">
                            {s.name}
                          </span>
                          <span className="text-slate-400 text-xs">
                            {s.code}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {/* 追加された銘柄リスト */}
              <div className="flex flex-wrap gap-2 mt-2">
                {stocks.map((stock, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-blue-50 text-blue-700 border-blue-100 pl-2 pr-1 py-1 flex items-center gap-1"
                  >
                    [{stock.code}] {stock.name}
                    <button
                      onClick={() => handleRemoveStock(index)}
                      className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                      aria-label={`[${stock.code}] ${stock.name}を削除`}
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* 本文入力 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              メモ内容
            </label>
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="気になったニュースや考察を入力..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-30 resize-none"
            />
          </div>

          {/* タグ入力 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              タグ (スペース区切り)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例: 決算 注目 長期保有"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={!content}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Save size={16} />
            保存する
          </button>
        </div>
      </div>
    </div>
  );
}
