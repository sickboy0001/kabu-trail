import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetHistorySkeleton } from "./parts/AssetHistorySettings";
import { ProfitLossHistorySkeleton } from "./parts/ProfitLossHistorySettings";
import { HoldingsPieSkeleton } from "./parts/HoldingsPieSettings";
import { HoldingsListSkeleton } from "./parts/HoldingsListSettings";
import { TreeMapSkeleton } from "./parts/HoldingsTreeMapSettings";

type Widget = {
  id: string;
  type: string;
  title: string;
  cols: number;
  order: number;
  settings: { [key: string]: any };
};

type Props = {
  widget: Widget;
  onColsChange: (id: string, cols: number) => void;
  onRemove: (id: string) => void;
  children?: React.ReactNode;
};

export function SortableWidgetCard({
  widget,
  onColsChange,
  onRemove,
  children,
}: Props) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    gridColumn: `span ${widget.cols}`,
    zIndex: isDragging ? 50 : 1,
  };

  const renderPreview = () => {
    switch (widget.type) {
      case "asset_history":
        return <AssetHistorySkeleton />;
      case "profit_loss_history":
        return <ProfitLossHistorySkeleton settings={widget.settings} />;
      case "holdings_pie":
        return <HoldingsPieSkeleton />;
      case "holdings_list":
        return <HoldingsListSkeleton />;
      case "holdings_tree_map":
      case "tree_map":
        return <TreeMapSkeleton />;
      default:
        return (
          <div className="flex flex-col gap-2 h-full justify-center px-4">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg shadow-sm p-3 ${isDragging ? "opacity-50 ring-2 ring-blue-500" : ""}`}
    >
      <div className="flex justify-between items-center mb-2 gap-2">
        {/* ドラッグハンドル */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 hover:bg-gray-100 rounded"
        >
          ⠿
        </div>
        <span className="text-xs font-bold truncate flex-1 ml-2">
          {widget.title}
        </span>

        {/* 設定トグルボタン */}
        {children && (
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-1 rounded transition-colors ${
              isSettingsOpen
                ? "bg-blue-100 text-blue-600"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            }`}
            title="設定"
          >
            <Settings size={14} />
          </button>
        )}

        {/* サイズ変更セレクトボックス */}
        <select
          value={widget.cols}
          onChange={(e) => onColsChange(widget.id, Number(e.target.value))}
          className="text-xs border rounded p-1"
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}列
            </option>
          ))}
        </select>

        {/* 削除ボタン */}
        <button
          onClick={() => onRemove(widget.id)}
          className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
          title="削除"
        >
          <X size={14} />
        </button>
      </div>

      <div className="h-16 bg-gray-50 rounded overflow-hidden border border-gray-100">
        {renderPreview()}
      </div>

      {children && isSettingsOpen && (
        <div className="mt-2 border-t pt-2">{children}</div>
      )}
    </div>
  );
}
