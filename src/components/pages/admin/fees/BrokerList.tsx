"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Landmark,
  FileText,
  Plus,
  Check,
  Edit,
  X,
  Trash2,
} from "lucide-react";
// import { cn } from "@/src/lib/utils"; // Shadcnのユーティリティ（なければ適宜書き換え）
import { cn } from "@/lib/utils";
import {
  createBroker,
  createFeeTemplate,
  updateBroker,
  countFeeRules,
  deleteFeeTemplate,
} from "@/services/fee";
import Toast from "@/components/ui/Toast";

export default function BrokerList({ brokers, selectedId }: any) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [formalName, setFormalName] = useState("");
  const [sortOrder, setSortOrder] = useState<number | "">("");
  const [isSaving, setIsSaving] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "info"
  );
  const router = useRouter();
  const [editingBrokerId, setEditingBrokerId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<
    Record<
      number,
      {
        name: string;
        formal_name: string;
        sort_order: number;
        is_active?: boolean;
      }
    >
  >({});
  const [savingEdit, setSavingEdit] = useState<Record<number, boolean>>({});

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  };

  const handleCreate = async (e: any) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("証券会社名を入力してください", "error");
      return;
    }
    setIsSaving(true);
    try {
      await createBroker(
        name.trim(),
        formalName.trim() || undefined,
        Number(sortOrder) || 0
      );
      setName("");
      setFormalName("");
      setSortOrder("");
      setShowForm(false);
      router.refresh();
      showToast("証券会社を追加しました", "success");
    } catch (err: any) {
      console.error(err);
      showToast("作成に失敗しました: " + (err?.message || "Unknown"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEdit = (broker: any) => {
    setEditingBrokerId(broker.id);
    setEditValues((s) => ({
      ...s,
      [broker.id]: {
        name: broker.name ?? "",
        formal_name: broker.formal_name ?? "",
        sort_order: broker.sort_order ?? 0,
        is_active: broker.is_active ?? true,
      },
    }));
  };

  const handleCancelEdit = (brokerId: number) => {
    setEditingBrokerId(null);
    setEditValues((s) => {
      const copy = { ...s };
      delete copy[brokerId];
      return copy;
    });
    setSavingEdit((s) => ({ ...s, [brokerId]: false }));
  };

  const handleSaveEdit = async (brokerId: number) => {
    const values = editValues[brokerId];
    if (!values || !values.name?.trim()) {
      showToast("証券会社名を入力してください", "error");
      return;
    }
    setSavingEdit((s) => ({ ...s, [brokerId]: true }));
    try {
      await updateBroker(brokerId, {
        name: values.name.trim(),
        formal_name: values.formal_name?.trim() || null,
        sort_order: Number(values.sort_order) || 0,
        is_active: !!values.is_active,
      });
      setEditingBrokerId(null);
      router.refresh();
      showToast("証券会社を更新しました", "success");
    } catch (err: any) {
      console.error(err);
      showToast("更新に失敗しました: " + (err?.message || "Unknown"), "error");
    } finally {
      setSavingEdit((s) => ({ ...s, [brokerId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {brokers.map((broker: any) => (
        <div key={broker.id} className="space-y-2">
          {/* 証券会社名 */}
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Landmark className="w-4 h-4 text-blue-600" />
            <>
              <span className="truncate">{broker.name}</span>
              {broker.is_active === false ? (
                <span
                  className="text-[10px] text-rose-700 ml-2 cursor-help"
                  title="非アクティブ"
                >
                  無効
                </span>
              ) : null}
            </>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] bg-slate-200 px-1 rounded">
                ID: {broker.id}
              </span>
              <div className="ml-2 flex items-center gap-2">
                <span className="text-[10px] bg-slate-100 px-1 rounded ml-2">
                  順: {broker.sort_order ?? 0}
                </span>
              </div>

              {editingBrokerId === broker.id ? (
                <>
                  <button
                    onClick={() => handleSaveEdit(broker.id)}
                    disabled={savingEdit[broker.id]}
                    className="flex items-center gap-1 p-1 rounded hover:bg-slate-100"
                    title="保存"
                  >
                    <Check className="w-3 h-3 text-green-600" />
                    <span className="text-xs">保存</span>
                  </button>
                  <button
                    onClick={() => handleCancelEdit(broker.id)}
                    className="flex items-center gap-1 p-1 rounded hover:bg-slate-100"
                    title="キャンセル"
                  >
                    <X className="w-3 h-3 text-slate-600" />
                    <span className="text-xs">キャンセル</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleStartEdit(broker)}
                  className="flex items-center gap-1 p-1 rounded hover:bg-slate-100"
                  title="編集"
                >
                  <Edit className="w-3 h-3 text-slate-700" />
                  <span className="text-xs">編集</span>
                </button>
              )}
            </div>
          </div>

          {/* プラン（テンプレート）一覧 */}
          <div className="ml-3 border-l-2 border-slate-200 pl-3 space-y-1">
            {broker.fee_templates?.map((template: any) => (
              <Link
                key={template.id}
                href={`?brokerId=${broker.id}&templateId=${template.id}`}
                className={cn(
                  "flex items-center gap-2 p-2 text-sm rounded-md transition-colors",
                  selectedId === String(template.id)
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "hover:bg-slate-100 text-slate-600"
                )}
              >
                <FileText className="w-3 h-3" />
                <span className="truncate">{template.name}</span>
                <span className="text-[10px] bg-slate-100 px-1 rounded ml-1">
                  順: {template.sort_order ?? 0}
                </span>
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      const count = await countFeeRules(template.id);
                      const msg = `このパターンを削除しますか？ 削除すると元に戻せません。\n紐づくルール数: ${count} 件`;
                      if (!confirm(msg)) return;

                      await deleteFeeTemplate(template.id);
                      router.refresh();
                      showToast("パターンを削除しました", "success");
                    } catch (err: any) {
                      console.error(err);
                      showToast(
                        "削除に失敗しました: " + (err?.message || "Unknown"),
                        "error"
                      );
                    }
                  }}
                  className="ml-auto p-1 rounded hover:bg-rose-100 text-rose-600"
                  title="削除"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                {selectedId === String(template.id) && (
                  <ChevronRight className="w-3 h-3" />
                )}
              </Link>
            ))}

            {/* 新規プラン追加ボタン */}
            <button
              onClick={async () => {
                try {
                  // 既存テンプレートの sort_order の最大値に 1 を足す
                  const existing = broker.fee_templates ?? [];
                  const maxSort = existing.length
                    ? Math.max(
                        ...existing.map((t: any) => Number(t.sort_order ?? 0))
                      )
                    : 0;
                  const newSort = Number(maxSort) + 1;

                  await createFeeTemplate(broker.id, "新規パターン", newSort);
                  router.refresh();
                  showToast("新しいパターンを追加しました", "success");
                } catch (err: any) {
                  console.error(err);
                  showToast(
                    "パターンの作成に失敗しました: " +
                      (err?.message || "Unknown"),
                    "error"
                  );
                }
              }}
              className="flex items-center gap-2 p-2 text-xs text-slate-400 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>パターンを追加</span>
            </button>
          </div>
        </div>
      ))}

      {/* 証券会社追加 */}
      {showForm ? (
        <form onSubmit={handleCreate} className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="証券会社名 (例: 松井証券)"
            className="w-full border p-2 rounded"
            required
          />
          <input
            value={formalName}
            onChange={(e) => setFormalName(e.target.value)}
            placeholder="正式名称 (任意)"
            className="w-full border p-2 rounded"
          />
          <input
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(e.target.value === "" ? "" : Number(e.target.value))
            }
            placeholder="表示順 (default: 0)"
            type="number"
            className="w-full border p-2 rounded"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className={`flex-1 px-4 py-2 rounded ${
                isSaving ? "opacity-60" : "bg-blue-600 text-white"
              }`}
            >
              {isSaving ? "追加中..." : "追加する"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 rounded border"
            >
              キャンセル
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          証券会社を追加
        </button>
      )}

      {/* 編集モーダル */}
      {editingBrokerId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => handleCancelEdit(editingBrokerId ?? 0)}
          />
          <div className="relative bg-white rounded p-6 w-full max-w-md z-10 shadow-lg">
            <h3 className="text-lg font-medium mb-4">証券会社を編集</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600">名称</label>
                <input
                  value={editValues[editingBrokerId ?? 0]?.name ?? ""}
                  onChange={(e) =>
                    setEditValues((s) => ({
                      ...s,
                      [editingBrokerId ?? 0]: {
                        ...(s[editingBrokerId ?? 0] ?? {}),
                        name: e.target.value,
                      },
                    }))
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600">正式名称</label>
                <input
                  value={editValues[editingBrokerId ?? 0]?.formal_name ?? ""}
                  onChange={(e) =>
                    setEditValues((s) => ({
                      ...s,
                      [editingBrokerId ?? 0]: {
                        ...(s[editingBrokerId ?? 0] ?? {}),
                        formal_name: e.target.value,
                      },
                    }))
                  }
                  className="w-full border p-2 rounded"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="is_active_checkbox"
                  type="checkbox"
                  checked={!!editValues[editingBrokerId ?? 0]?.is_active}
                  onChange={(e) =>
                    setEditValues((s) => ({
                      ...s,
                      [editingBrokerId ?? 0]: {
                        ...(s[editingBrokerId ?? 0] ?? {}),
                        is_active: e.target.checked,
                      },
                    }))
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="is_active_checkbox" className="text-sm">
                  有効
                </label>
              </div>

              <div>
                <label className="block text-xs text-slate-600">表示順</label>
                <input
                  type="number"
                  value={editValues[editingBrokerId ?? 0]?.sort_order ?? 0}
                  onChange={(e) =>
                    setEditValues((s) => ({
                      ...s,
                      [editingBrokerId ?? 0]: {
                        ...(s[editingBrokerId ?? 0] ?? {}),
                        sort_order: Number(e.target.value) || 0,
                      },
                    }))
                  }
                  className="w-28 border p-2 rounded"
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleSaveEdit(editingBrokerId ?? 0)}
                  disabled={savingEdit[editingBrokerId ?? 0]}
                  className="px-4 py-2 rounded bg-blue-600 text-white"
                >
                  {savingEdit[editingBrokerId ?? 0] ? "保存中..." : "保存"}
                </button>
                <button
                  onClick={() => handleCancelEdit(editingBrokerId ?? 0)}
                  className="px-4 py-2 rounded border"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast
        open={toastOpen}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
