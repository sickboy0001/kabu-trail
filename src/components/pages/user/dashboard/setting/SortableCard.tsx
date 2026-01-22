import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";

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
};

export function SortableWidgetCard({ widget, onColsChange, onRemove }: Props) {
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

      <div className="h-12 bg-gray-50 rounded flex items-center justify-center text-[10px] text-gray-400">
        PREVIEW
      </div>
    </div>
  );
}
