"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, History, Edit } from "lucide-react";
import { saveFeeRules, updateFeeTemplate } from "@/app/admin/fees/actions";
import { useRouter } from "next/navigation";
import Toast from "@/components/ui/Toast";

export default function RuleEditor({
  templateId,
  initialRules,
  templateName,
  templateSortOrder,
}: any) {
  const router = useRouter();
  const [rules, setRules] = useState(initialRules || []);
  const [editingTemplateName, setEditingTemplateName] = useState(false);
  const [templateNameValue, setTemplateNameValue] = useState<string>(
    templateName ?? ""
  );
  const [templateSortOrderValue, setTemplateSortOrderValue] = useState<
    number | string
  >(templateSortOrder ?? 0);
  const [savingTemplateName, setSavingTemplateName] = useState(false);

  useEffect(() => {
    setTemplateNameValue(templateName ?? "");
    setTemplateSortOrderValue(templateSortOrder ?? 0);
  }, [templateName, templateId, templateSortOrder]);
  const [isSaving, setIsSaving] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">(
    "info"
  );

  // 閾値の表示ラベルをクリックすると編集できるようにする
  const [editingThresholdIndex, setEditingThresholdIndex] = useState<
    number | null
  >(null);
  const [editingThresholdValue, setEditingThresholdValue] =
    useState<string>("");

  // 手数料率と固定額の表示ラベル -> クリックで編集するための state
  const [editingFeeRateIndex, setEditingFeeRateIndex] = useState<number | null>(
    null
  );
  const [editingFeeRateValue, setEditingFeeRateValue] = useState<string>("");
  const [editingFixedFeeIndex, setEditingFixedFeeIndex] = useState<
    number | null
  >(null);
  const [editingFixedFeeValue, setEditingFixedFeeValue] = useState<string>("");

  const formatYen = (n: number) => {
    return new Intl.NumberFormat("ja-JP").format(Math.round(n));
  };

  const formatPercent = (rateDecimal: number) => {
    const percent = (rateDecimal ?? 0) * 100;
    return `${Number(percent.toFixed(3)).toLocaleString("ja-JP")}%`;
  };

  // initialRules が変化したらローカル state を再セット（サーバーからの新しいフェッチを反映）
  useEffect(() => {
    setRules(initialRules || []);
  }, [initialRules, templateId]);

  const addRow = () => {
    const newRow = {
      id: Math.random(), // 仮のID
      threshold_amount: 0,
      fee_rate: 0,
      fixed_fee: 0,
      is_daily_sum: false,
    };
    setRules((prev: any[]) => [...prev, newRow]);
  };

  const updateRule = (index: number, update: any) => {
    setRules((prev: any[]) =>
      prev.map((r, i) => (i === index ? { ...r, ...update } : r))
    );
  };

  const removeRule = (idOrIndex: number) => {
    console.log("removeRule called with", idOrIndex);
    setRules((prev: any[]) => {
      // まず id による削除を試みる
      const removedById = prev.filter((r) => r.id !== idOrIndex);
      if (removedById.length !== prev.length) {
        console.log(
          "removeRule: removed by id",
          idOrIndex,
          "remaining:",
          removedById.length
        );
        showToast("ルールを削除しました", "info");
        return removedById;
      }
      // id マッチがなければ index として削除
      const removedByIndex = prev.filter((_, i) => i !== idOrIndex);
      console.log(
        "removeRule: removed by index",
        idOrIndex,
        "remaining:",
        removedByIndex.length
      );
      showToast("ルールを削除しました", "info");
      return removedByIndex;
    });
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  };

  const handleSave = async () => {
    if (!templateId) {
      showToast("Template ID が必要です", "error");
      return;
    }
    setIsSaving(true);
    try {
      // fee_rate は UI で % 表示しているので Decimal に戻す
      console.log("handleSave: current rules before save", rules);
      const payload = rules.map((r: any) => ({
        ...r,
        fee_rate:
          typeof r.fee_rate === "number" ? r.fee_rate : Number(r.fee_rate),
      }));

      console.log("handleSave: payload", payload);
      await saveFeeRules(Number(templateId), payload);
      showToast("保存しました", "success");
    } catch (err: any) {
      console.error(err);
      showToast("保存に失敗しました: " + (err?.message || "Unknown"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">ルール編集</h1>
            <div className="flex items-center gap-2">
              {editingTemplateName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={templateNameValue}
                    onChange={(e) => setTemplateNameValue(e.target.value)}
                    className="border p-1 rounded"
                  />
                  <input
                    type="number"
                    value={String(templateSortOrderValue ?? 0)}
                    onChange={(e) =>
                      setTemplateSortOrderValue(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-20 border p-1 rounded"
                    title="表示順"
                  />
                  <button
                    onClick={async () => {
                      if (!templateId) return;
                      setSavingTemplateName(true);
                      try {
                        await updateFeeTemplate(Number(templateId), {
                          name: templateNameValue.trim(),
                          sort_order: Number(templateSortOrderValue) || 0,
                        });
                        setEditingTemplateName(false);
                        showToast(
                          "テンプレート名・表示順を更新しました",
                          "success"
                        );
                        router.refresh();
                      } catch (err: any) {
                        console.error(err);
                        showToast(
                          "更新に失敗しました: " + (err?.message || "Unknown"),
                          "error"
                        );
                      } finally {
                        setSavingTemplateName(false);
                      }
                    }}
                    className="px-2 py-1 rounded bg-blue-600 text-white"
                    disabled={savingTemplateName}
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setEditingTemplateName(false);
                      setTemplateNameValue(templateName ?? "");
                      setTemplateSortOrderValue(templateSortOrder ?? 0);
                    }}
                    className="px-2 py-1 rounded border"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">
                    {templateName || "(名前未設定)"}
                  </span>
                  <span className="text-[10px] bg-slate-100 px-1 rounded ml-1">
                    順: {String(templateSortOrderValue ?? 0)}
                  </span>
                  <button
                    onClick={() => setEditingTemplateName(true)}
                    className="flex items-center gap-1 p-1 rounded hover:bg-slate-100"
                    title="テンプレート名を編集"
                  >
                    <Edit className="w-4 h-4 text-slate-700" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm text-slate-500">
              Template ID: {templateId} の手数料ロジックを設定します
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-slate-50 text-sm">
            <History className="w-4 h-4" /> 履歴
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 ${
              isSaving ? "opacity-60" : "bg-blue-600 hover:bg-blue-700"
            } text-white rounded text-sm font-medium`}
          >
            <Save className="w-4 h-4" /> {isSaving ? "保存中..." : "設定を保存"}
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        {rules.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p className="mb-4">
              このテンプレートにはルールがありません。ルールを追加してください。
            </p>
            <button
              onClick={addRow}
              className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline text-sm"
            >
              <Plus className="w-4 h-4" /> ルール行を追加
            </button>
          </div>
        ) : (
          <>
            <table className="w-full text-left text-sm table-fixed">
              <colgroup>
                <col style={{ width: "220px" }} />
                <col style={{ width: "150px" }} />
                <col style={{ width: "150px" }} />
                <col style={{ width: "140px" }} />
                <col />
              </colgroup>
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-3 font-semibold">閾値 (円以下)</th>
                  <th className="p-3 font-semibold">手数料率 (%)</th>
                  <th className="p-3 font-semibold">固定額 (円)</th>
                  <th className="p-3 font-semibold text-center">1日合計判定</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rules.map((rule: any, index: number) => (
                  <tr key={rule.id ?? index} className="hover:bg-slate-50">
                    <td className="p-3 text-right">
                      {editingThresholdIndex === index ? (
                        <input
                          autoFocus
                          type="number"
                          value={editingThresholdValue}
                          onChange={(e) =>
                            setEditingThresholdValue(e.target.value)
                          }
                          onBlur={() => {
                            // コミット
                            const val = Number(editingThresholdValue) || 0;
                            updateRule(index, { threshold_amount: val });
                            setEditingThresholdIndex(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = Number(editingThresholdValue) || 0;
                              updateRule(index, { threshold_amount: val });
                              setEditingThresholdIndex(null);
                            } else if (e.key === "Escape") {
                              setEditingThresholdIndex(null);
                            }
                          }}
                          className="w-full border p-1 rounded text-right"
                        />
                      ) : (
                        <div
                          className="w-full cursor-pointer"
                          onClick={() => {
                            setEditingThresholdIndex(index);
                            setEditingThresholdValue(
                              String(rule.threshold_amount ?? 0)
                            );
                          }}
                        >
                          <span className="block text-right font-mono">
                            {formatYen(rule.threshold_amount ?? 0)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {editingFeeRateIndex === index ? (
                        <input
                          autoFocus
                          type="number"
                          step="0.001"
                          value={editingFeeRateValue}
                          onChange={(e) =>
                            setEditingFeeRateValue(e.target.value)
                          }
                          onBlur={() => {
                            const val = Number(editingFeeRateValue) || 0;
                            updateRule(index, { fee_rate: val / 100 });
                            setEditingFeeRateIndex(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = Number(editingFeeRateValue) || 0;
                              updateRule(index, { fee_rate: val / 100 });
                              setEditingFeeRateIndex(null);
                            } else if (e.key === "Escape") {
                              setEditingFeeRateIndex(null);
                            }
                          }}
                          className="w-full border p-1 rounded text-right"
                        />
                      ) : (
                        <div
                          className="w-full cursor-pointer"
                          onClick={() => {
                            setEditingFeeRateIndex(index);
                            setEditingFeeRateValue(
                              String((rule.fee_rate ?? 0) * 100)
                            );
                          }}
                        >
                          <span className="block text-right font-mono">
                            {formatPercent(rule.fee_rate ?? 0)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {editingFixedFeeIndex === index ? (
                        <input
                          autoFocus
                          type="number"
                          value={editingFixedFeeValue}
                          onChange={(e) =>
                            setEditingFixedFeeValue(e.target.value)
                          }
                          onBlur={() => {
                            const val = Number(editingFixedFeeValue) || 0;
                            updateRule(index, { fixed_fee: val });
                            setEditingFixedFeeIndex(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = Number(editingFixedFeeValue) || 0;
                              updateRule(index, { fixed_fee: val });
                              setEditingFixedFeeIndex(null);
                            } else if (e.key === "Escape") {
                              setEditingFixedFeeIndex(null);
                            }
                          }}
                          className="w-full border p-1 rounded text-right"
                        />
                      ) : (
                        <div
                          className="w-full cursor-pointer"
                          onClick={() => {
                            setEditingFixedFeeIndex(index);
                            setEditingFixedFeeValue(
                              String(rule.fixed_fee ?? 0)
                            );
                          }}
                        >
                          <span className="block text-right font-mono">
                            {formatYen(rule.fixed_fee ?? 0)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={!!rule.is_daily_sum}
                        onChange={(e) =>
                          updateRule(index, { is_daily_sum: e.target.checked })
                        }
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          console.log("delete clicked for", rule.id ?? index);
                          removeRule(rule.id ?? index);
                        }}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        aria-label={"Delete rule " + (rule.id ?? index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-4 bg-slate-50/50 border-t">
              <button
                onClick={addRow}
                className="flex items-center gap-2 text-blue-600 font-medium hover:underline text-sm"
              >
                <Plus className="w-4 h-4" /> ルール行を追加
              </button>
            </div>
          </>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <p className="text-xs text-blue-700 leading-relaxed">
          💡 <b>ヒント:</b> 「閾値」は判定を行う上限金額です。例えば 1,000,000
          と入力すると、100万円以下の取引にその利率が適用されます。
          最も大きい数値（例：999,999,999）を設定した行が「それ以上」のルールとして機能します。
        </p>
      </div>

      <Toast
        open={toastOpen}
        message={toastMessage}
        type={toastType}
        onClose={() => setToastOpen(false)}
      />
    </div>
  );
}
