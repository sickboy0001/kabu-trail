import { useState } from "react";
import { X, ClipboardList, Save, Loader2 } from "lucide-react";
import { addObservationLog } from "@/services/stocks";
import { toast } from "sonner";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  stockCode: string;
  stockName?: string;
};

export function AddObservationLogModal({
  isOpen,
  onClose,
  userId,
  stockCode,
  stockName,
}: Props) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!userId || !comment.trim()) return;

    try {
      setIsSubmitting(true);
      await addObservationLog(userId, stockCode, comment);
      toast.success("観察ログを記録しました");
      setComment("");
      onClose();
    } catch (error) {
      console.error("Failed to add observation log:", error);
      toast.error("ログの記録に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <ClipboardList size={18} className="text-blue-600" />
            観察ログを追加
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-sm text-slate-600">
            <span className="font-bold text-slate-800">
              {stockName} ({stockCode})
            </span>{" "}
            についてのメモや気付きを記録します。
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="例: 決算発表を受けて上昇トレンド入り。押し目でエントリー検討。"
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-30 resize-none"
            autoFocus
          />
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
            disabled={!comment.trim() || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
