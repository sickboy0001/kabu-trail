import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { Undo2, X, Plus, Trash2 } from "lucide-react";

// 前述の Widget 型を使用
import { SortableWidgetCard } from "./SortableCard";

type Widget = {
  id: string;
  type: string;
  title: string;
  cols: number;
  order: number;
  settings: { [key: string]: any };
};

type DashboardPattern = {
  id: string;
  name: string;
  is_default: boolean;
  columns: number;
  widgets: Widget[];
};

type Props = {
  initialPatterns: DashboardPattern[];
  currentPatternId: string;
  onSave: (patterns: DashboardPattern[]) => void;
  onCancel: () => void;
};

// 追加可能なウィジェットタイプの定義
const WIDGET_TYPES = [
  { type: "asset_summary", title: "資産情報" },
  { type: "profit_loss_summary", title: "評価損益合計" },
  { type: "day_over_day", title: "前日比" },
  { type: "asset_history", title: "資産推移" },
  { type: "portfolio_pie", title: "ポートフォリオ" },
  { type: "stock_list", title: "保有銘柄一覧" },
];

export default function DashboardSettingClient({
  initialPatterns,
  currentPatternId,
  onSave,
  onCancel,
}: Props) {
  const [patterns, setPatterns] = useState(initialPatterns);
  const [activeId, setActiveId] = useState(
    currentPatternId || initialPatterns[0]?.id,
  );

  // 現在編集中のパターンを取得
  const activePattern = patterns.find((p) => p.id === activeId) || patterns[0];

  const [selectedType, setSelectedType] = useState(WIDGET_TYPES[0].type);
  const [removedWidgetData, setRemovedWidgetData] = useState<{
    widget: any;
    index: number;
  } | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // トーストの自動消去（5秒後）
  useEffect(() => {
    if (removedWidgetData) {
      const timer = setTimeout(() => {
        setRemovedWidgetData(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [removedWidgetData]);

  // パターン切り替え時にUndo履歴をクリア
  useEffect(() => {
    setRemovedWidgetData(null);
  }, [activeId]);

  // アクティブなパターンを更新するヘルパー関数
  const updateActivePattern = (
    updater: DashboardPattern | ((prev: DashboardPattern) => DashboardPattern),
  ) => {
    setPatterns((prevPatterns) =>
      prevPatterns.map((p) => {
        if (p.id !== activeId) return p;
        return typeof updater === "function"
          ? (updater as (prev: DashboardPattern) => DashboardPattern)(p)
          : updater;
      }),
    );
  };

  // 並び替え完了時の処理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      updateActivePattern((prev) => {
        const oldIndex = prev.widgets.findIndex((w) => w.id === active.id);
        const newIndex = prev.widgets.findIndex((w) => w.id === over.id);
        const newWidgets = arrayMove(prev.widgets, oldIndex, newIndex).map(
          (w, i) => ({
            ...w,
            order: i + 1, // 順序を再採番
          }),
        );
        return { ...prev, widgets: newWidgets };
      });
    }
  };

  // サイズ（列数）変更の処理
  const updateWidgetCols = (id: string, newCols: number) => {
    updateActivePattern((prev) => ({
      ...prev,
      widgets: prev.widgets.map((w) =>
        w.id === id ? { ...w, cols: newCols } : w,
      ),
    }));
  };

  // ウィジェット削除処理
  const handleRemoveWidget = (id: string) => {
    const index = activePattern.widgets.findIndex((w) => w.id === id);
    const widget = activePattern.widgets[index];
    if (!widget) return;

    // Undo用に保存
    setRemovedWidgetData({ widget, index });

    updateActivePattern((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== id),
    }));
  };

  // Undo処理（削除の取り消し）
  const handleUndoRemove = () => {
    if (!removedWidgetData) return;

    updateActivePattern((prev) => {
      const newWidgets = [...prev.widgets];
      newWidgets.splice(removedWidgetData.index, 0, removedWidgetData.widget);
      return { ...prev, widgets: newWidgets };
    });

    setRemovedWidgetData(null);
  };

  // 列数に応じたクラス名を決定するヘルパー
  const getGridClass = (cols: number) => {
    switch (cols) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-4";
      case 5:
        return "grid-cols-5";
      default:
        return "grid-cols-6";
    }
  };

  // ウィジェット追加処理
  const handleAddWidget = () => {
    const typeInfo = WIDGET_TYPES.find((t) => t.type === selectedType);
    if (!typeInfo) return;

    const newWidget = {
      id: `w-${Date.now()}`, // 一意なIDを生成
      type: typeInfo.type,
      title: typeInfo.title,
      cols: 1, // デフォルトは1列
      order: activePattern.widgets.length + 1,
      settings: {},
    };

    updateActivePattern((prev) => ({
      ...prev,
      widgets: [...prev.widgets, newWidget],
    }));
  };

  // 新しいレイアウトパターンの追加
  const handleAddPattern = () => {
    const newId = `pattern_${Date.now()}`;
    const newPattern = {
      id: newId,
      name: "新規レイアウト",
      is_default: false,
      columns: 3,
      widgets: [],
    };
    setPatterns((prev) => [...prev, newPattern]);
    setActiveId(newId);
  };

  // 現在のレイアウトパターンを削除
  const handleDeletePattern = () => {
    if (patterns.length <= 1) {
      alert("これ以上削除できません。少なくとも1つのレイアウトが必要です。");
      return;
    }
    if (!confirm("現在のレイアウトを削除してもよろしいですか？")) return;

    const newPatterns = patterns.filter((p) => p.id !== activeId);
    setPatterns(newPatterns);
    setActiveId(newPatterns[0].id);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">ダッシュボード設定</h1>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              キャンセル
            </button>
            <button
              onClick={() => onSave(patterns)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              保存する
            </button>
          </div>
        </div>

        {/* レイアウト選択・管理エリア */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4 flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-blue-700 mb-1">
              編集するレイアウトを選択
            </label>
            <select
              value={activeId}
              onChange={(e) => setActiveId(e.target.value)}
              className="w-full border border-blue-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {patterns.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleAddPattern}
              className="flex items-center gap-1 bg-white border border-blue-300 text-blue-700 px-3 py-2 rounded text-sm font-bold hover:bg-blue-50"
            >
              <Plus size={16} />
              新規作成
            </button>
            <button
              onClick={handleDeletePattern}
              className="flex items-center gap-1 bg-white border border-red-300 text-red-600 px-3 py-2 rounded text-sm font-bold hover:bg-red-50"
            >
              <Trash2 size={16} />
              削除
            </button>
          </div>
        </div>

        {/* 設定フォーム */}
        <div className="bg-white p-4 rounded-lg border shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              レイアウト名
            </label>
            <input
              type="text"
              value={activePattern.name}
              onChange={(e) =>
                updateActivePattern((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              全体の列数
            </label>
            <select
              value={activePattern.columns}
              onChange={(e) =>
                updateActivePattern((prev) => ({
                  ...prev,
                  columns: Number(e.target.value),
                }))
              }
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}列
                </option>
              ))}
            </select>
          </div>
          <div className="pb-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={activePattern.is_default}
                onChange={(e) => {
                  // デフォルトにする場合、他のパターンのis_defaultをfalseにする
                  if (e.target.checked) {
                    setPatterns((prev) =>
                      prev.map((p) => ({
                        ...p,
                        is_default: p.id === activeId,
                      })),
                    );
                  } else {
                    updateActivePattern({
                      ...activePattern,
                      is_default: false,
                    });
                  }
                }}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
              />
              <span className="text-sm text-gray-700">
                デフォルトレイアウトにする
              </span>
            </label>
          </div>
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {/* グリッドプレビュー */}
        <div
          className={`grid ${getGridClass(activePattern.columns)} gap-4 bg-gray-100 p-4 rounded-xl border-2 border-dashed border-gray-300`}
        >
          <SortableContext
            items={activePattern.widgets.map((w) => w.id)}
            strategy={rectSortingStrategy}
          >
            {activePattern.widgets.map((widget) => (
              <SortableWidgetCard
                key={widget.id}
                widget={widget}
                onColsChange={updateWidgetCols}
                onRemove={handleRemoveWidget}
              />
            ))}
          </SortableContext>
        </div>
      </DndContext>

      {/* ウィジェット追加エリア */}
      <div className="mt-6 bg-white p-4 rounded-lg border shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-3">
          新しいウィジェットを追加
        </h3>
        <div className="flex gap-2 max-w-md">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {WIDGET_TYPES.map((t) => (
              <option key={t.type} value={t.type}>
                {t.title}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddWidget}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-blue-700 whitespace-nowrap"
          >
            追加
          </button>
        </div>
      </div>

      {/* Undoトースト */}
      {removedWidgetData && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-4">
            <span className="text-sm">ウィジェットを削除しました</span>
            <button
              onClick={handleUndoRemove}
              className="text-blue-300 hover:text-blue-100 text-sm font-bold flex items-center gap-1"
            >
              <Undo2 size={16} />
              元に戻す
            </button>
            <button
              onClick={() => setRemovedWidgetData(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
