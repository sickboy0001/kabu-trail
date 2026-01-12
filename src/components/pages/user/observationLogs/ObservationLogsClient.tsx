"use client";

import { useState, useMemo, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Plus, Filter, ArrowUpDown, Undo2 } from "lucide-react";
import { ObservationLogCard } from "./ObservationLogCard";
import {
  ObservationLogModal,
  type ObservationLogFormData,
} from "./ObservationLogModal";
import {
  getObservationLogs,
  insertObservationLog,
  updateObservationLog,
} from "@/services/observationLogs";
import { getStockNamesByCodes, type StockInfo } from "@/services/stocks";

export type ObservationLog = {
  id: number;
  userId: string;
  date: string;
  content: string;
  stocks: StockInfo[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  user: User;
};

// 今日の日付をYYYY-MM-DD形式で取得するヘルパー
const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function ObservationLogsClient({ user }: Props) {
  // メモ一覧の状態管理
  const [logs, setLogs] = useState<ObservationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // データ取得関数
  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const data = await getObservationLogs(user.id);

      // 銘柄名取得のためのコード収集
      const allCodes = new Set<string>();
      (data || []).forEach((item: any) => {
        if (Array.isArray(item.stocks)) {
          item.stocks.forEach((c: string) => allCodes.add(c));
        }
      });
      const stockNames = await getStockNamesByCodes(Array.from(allCodes));
      const stockMap = new Map(stockNames.map((s) => [s.code, s.name]));

      // DBデータをUI用データに変換
      const formattedLogs: ObservationLog[] = (data || []).map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        date: item.date.replace(/-/g, "/"), // YYYY-MM-DD -> YYYY/MM/DD
        content: item.content,
        stocks: (item.stocks || []).map((code: string) => ({
          code,
          name: stockMap.get(code) || "",
        })),
        tags: item.tags || [],
        isActive: item.is_active,
        createdAt: new Date(item.created_at).toLocaleString("ja-JP"),
        updatedAt: new Date(item.updated_at).toLocaleString("ja-JP"),
      }));
      setLogs(formattedLogs);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初回ロード
  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  // モーダルとフォームの状態管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);

  // フィルター・ソート状態
  const [showInactive, setShowInactive] = useState(false);
  const [filterStockText, setFilterStockText] = useState("");
  const [sortKey, setSortKey] = useState<"date" | "createdAt" | "updatedAt">(
    "date"
  );

  // Undo用状態
  const [undoLogId, setUndoLogId] = useState<number | null>(null);
  const [undoAction, setUndoAction] = useState<"delete" | "reactivate" | null>(
    null
  );

  // 編集モード開始
  const handleEdit = (e: React.MouseEvent, log: ObservationLogFormData) => {
    e.stopPropagation();
    setEditingLogId(log.id);
    setIsModalOpen(true);
  };

  // メモ保存
  const handleSave = async (data: ObservationLogFormData) => {
    try {
      // DB保存用にデータを整形
      const payload = {
        user_id: user.id,
        date: data.date || getTodayString(), // YYYY-MM-DD
        content: data.content,
        stocks: data.stocks,
        tags: data.tags,
      };

      if (editingLogId !== null) {
        // 更新処理
        await updateObservationLog(editingLogId, payload);
      } else {
        // 新規作成処理
        await insertObservationLog({
          ...payload,
          is_active: true,
        });
      }
      // リストを再取得して更新
      await fetchLogs();
    } catch (error) {
      console.error("Failed to save log:", error);
      alert("保存に失敗しました。");
    }
    handleCloseModal();
  };

  // モーダルを閉じてリセット
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLogId(null);
  };

  // 削除処理（論理削除）
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await updateObservationLog(id, { is_active: false });
      await fetchLogs();

      setUndoLogId(id);
      setUndoAction("delete");
    } catch (error) {
      console.error("Failed to delete log:", error);
      alert("削除に失敗しました。");
    }
  };

  // 有効化処理
  const handleReactivate = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await updateObservationLog(id, { is_active: true });
      await fetchLogs();

      setUndoLogId(id);
      setUndoAction("reactivate");
    } catch (error) {
      console.error("Failed to reactivate log:", error);
      alert("有効化に失敗しました。");
    }
  };

  // Undo処理
  const handleUndo = async () => {
    if (undoLogId !== null && undoAction) {
      try {
        // 削除のUndo -> 有効化 (is_active: true)
        // 有効化のUndo -> 無効化 (is_active: false)
        const targetIsActive = undoAction === "delete";
        await updateObservationLog(undoLogId, { is_active: targetIsActive });
        await fetchLogs();

        setUndoLogId(null);
        setUndoAction(null);
      } catch (error) {
        console.error("Undo failed:", error);
        alert("元に戻す操作に失敗しました。");
      }
    }
  };

  // Undoトーストの自動消去
  useEffect(() => {
    if (undoLogId !== null) {
      const timer = setTimeout(() => {
        setUndoLogId(null);
        setUndoAction(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [undoLogId]);

  // フィルタリングとソート
  const filteredAndSortedLogs = useMemo(() => {
    let result = logs;

    // 有効/無効フィルター
    if (!showInactive) {
      result = result.filter((log) => log.isActive);
    }

    // 銘柄フィルター
    if (filterStockText) {
      const lowerFilter = filterStockText.toLowerCase();
      result = result.filter((log) =>
        log.stocks.some(
          (s) =>
            s.code.toLowerCase().includes(lowerFilter) ||
            s.name.toLowerCase().includes(lowerFilter)
        )
      );
    }

    // ソート
    result = [...result].sort((a, b) => {
      if (a[sortKey] < b[sortKey]) return 1;
      if (a[sortKey] > b[sortKey]) return -1;
      // 同値の場合は作成日時で降順（新しいものが上）
      if (a.createdAt < b.createdAt) return 1;
      if (a.createdAt > b.createdAt) return -1;
      return 0;
    });

    return result;
  }, [logs, showInactive, filterStockText, sortKey]);

  return (
    <div className="space-y-4 pt-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-800">
              監視メモ Observation Logs
            </h2>
            <span className="text-sm text-slate-500">
              {filteredAndSortedLogs.length} / {logs.length} 件
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            日々の市場観察や銘柄分析のメモを記録・管理します。
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus size={16} />
          新規メモ
        </button>
      </div>

      {/* フィルター・ソートエリア */}
      <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-500" />
          <input
            type="text"
            placeholder="銘柄コード・名前で検索"
            value={filterStockText}
            onChange={(e) => setFilterStockText(e.target.value)}
            className="text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown size={16} className="text-slate-500" />
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as any)}
            className="text-sm border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="date">日順</option>
            <option value="createdAt">入力日順</option>
            <option value="updatedAt">更新日順</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none ml-auto">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
          />
          <span className="text-sm text-slate-600">削除済み(無効)も含める</span>
        </label>
      </div>

      {/* Google Keep風グリッドレイアウト */}
      {isLoading ? (
        <div className="text-center py-10 text-slate-500">読み込み中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedLogs.map((log) => (
            <ObservationLogCard
              key={log.id}
              // @ts-ignore: ObservationLogCardの型定義と互換性を持たせているが、厳密な型チェックを回避
              log={log}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onReactivate={handleReactivate}
            />
          ))}
        </div>
      )}

      {/* Undoトースト (右下固定) */}
      {undoLogId !== null && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-4">
            <span className="text-sm">
              {undoAction === "delete"
                ? "メモを削除しました"
                : "メモを有効化しました"}
            </span>
            <button
              onClick={handleUndo}
              className="text-blue-300 hover:text-blue-100 text-sm font-bold flex items-center gap-1"
            >
              <Undo2 size={16} />
              元に戻す(OK)
            </button>
          </div>
        </div>
      )}

      {/* 新規作成モーダル */}
      <ObservationLogModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        // @ts-ignore
        initialData={
          editingLogId ? logs.find((l) => l.id === editingLogId) || null : null
        }
      />
    </div>
  );
}
