import { useState } from "react";
import {
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Save,
  X,
  LayoutGrid,
} from "lucide-react";

export type DashboardItem = {
  id: string;
  label: string;
  visible: boolean;
  colSpan?: number;
};

type Props = {
  initialItems: DashboardItem[];
  initialColumnCount: number;
  initialSummaryVisibility: Record<string, boolean>;
  summaryItemDefs: readonly { readonly key: string; readonly label: string }[];
  onSave: (
    items: DashboardItem[],
    columnCount: number,
    summaryVisibility: Record<string, boolean>,
  ) => void;
  onCancel: () => void;
};

export default function DashboardSettings({
  initialItems,
  initialColumnCount,
  initialSummaryVisibility,
  summaryItemDefs,
  onSave,
  onCancel,
}: Props) {
  const [items, setItems] = useState<DashboardItem[]>(initialItems);
  const [columnCount, setColumnCount] = useState(initialColumnCount);
  const [summaryVisibility, setSummaryVisibility] = useState<
    Record<string, boolean>
  >(initialSummaryVisibility);

  const toggleVisibility = (index: number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      visible: !newItems[index].visible,
    };
    setItems(newItems);
  };

  const changeColSpan = (index: number, span: number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      colSpan: span,
    };
    setItems(newItems);
  };

  const toggleSummaryItem = (key: string) => {
    setSummaryVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [
      newItems[index],
      newItems[index - 1],
    ];
    setItems(newItems);
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index + 1], newItems[index]] = [
      newItems[index],
      newItems[index + 1],
    ];
    setItems(newItems);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            ダッシュボード設定
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            表示項目の選択と並び替えができます
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="mb-6 pb-6 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <LayoutGrid size={18} />
          サマリーカードの列数
        </h3>
        <div className="flex gap-2">
          {[3, 4, 5, 6].map((count) => (
            <button
              key={count}
              onClick={() => setColumnCount(count)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                columnCount === count
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {count}列
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 pb-6 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
          <Eye size={18} />
          サマリーカードの表示項目
        </h3>
        <div className="flex flex-wrap gap-3">
          {summaryItemDefs.map((item) => (
            <button
              key={item.key}
              onClick={() => toggleSummaryItem(item.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                summaryVisibility[item.key]
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              {summaryVisibility[item.key] ? (
                <Eye size={16} />
              ) : (
                <EyeOff size={16} />
              )}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
              item.visible
                ? "bg-white border-slate-200"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleVisibility(index)}
                className={`p-2 rounded-lg transition-colors ${
                  item.visible
                    ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                    : "text-slate-400 bg-slate-100 hover:bg-slate-200"
                }`}
                title={item.visible ? "非表示にする" : "表示する"}
              >
                {item.visible ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
              <span
                className={`font-medium ${
                  item.visible ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {item.label}
              </span>

              {/* 幅設定コントロール */}
              {item.visible && (
                <div className="flex items-center gap-2 ml-4">
                  {(item.id === "history" || item.id === "summary") && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-500 mr-1">幅:</span>
                      {[1, 2, 3, 4].map((span) => (
                        <button
                          key={span}
                          onClick={() => changeColSpan(index, span)}
                          className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                            item.colSpan === span
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {span}
                        </button>
                      ))}
                    </div>
                  )}
                  {item.id === "pie" && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-slate-500 mr-1">幅:</span>
                      {[1, 2].map((span) => (
                        <button
                          key={span}
                          onClick={() => changeColSpan(index, span)}
                          className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                            item.colSpan === span
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {span}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="上へ移動"
              >
                <ArrowUp size={18} />
              </button>
              <button
                onClick={() => moveDown(index)}
                disabled={index === items.length - 1}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                title="下へ移動"
              >
                <ArrowDown size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
        >
          キャンセル
        </button>
        <button
          onClick={() => onSave(items, columnCount, summaryVisibility)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm"
        >
          <Save size={18} />
          設定を保存
        </button>
      </div>
    </div>
  );
}
