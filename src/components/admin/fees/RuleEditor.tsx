"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, History } from "lucide-react";
import { saveFeeRules } from "@/app/admin/fees/actions";

export default function RuleEditor({ templateId, initialRules }: any) {
  const [rules, setRules] = useState(initialRules || []);
  const [isSaving, setIsSaving] = useState(false);

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

  const removeRule = (index: number) => {
    setRules((prev: any[]) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!templateId) {
      alert("Template ID が必要です");
      return;
    }
    setIsSaving(true);
    try {
      // fee_rate は UI で % 表示しているので Decimal に戻す
      const payload = rules.map((r: any) => ({
        ...r,
        fee_rate:
          typeof r.fee_rate === "number" ? r.fee_rate : Number(r.fee_rate),
      }));

      await saveFeeRules(Number(templateId), payload);
      alert("保存しました");
    } catch (err: any) {
      console.error(err);
      alert("保存に失敗しました: " + (err?.message || "Unknown"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">
            ルール編集{" "}
            <span className="text-sm text-slate-500 ml-2">
              ({rules.length} 行)
            </span>
          </h1>
          <p className="text-sm text-slate-500">
            Template ID: {templateId} の手数料ロジックを設定します
          </p>
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
            <table className="w-full text-left text-sm">
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
                    <td className="p-3">
                      <input
                        type="number"
                        value={rule.threshold_amount ?? 0}
                        onChange={(e) =>
                          updateRule(index, {
                            threshold_amount: Number(e.target.value),
                          })
                        }
                        className="w-full border p-1 rounded"
                        placeholder="1,000,000"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        step="0.001"
                        value={(rule.fee_rate ?? 0) * 100}
                        onChange={(e) =>
                          updateRule(index, {
                            fee_rate: Number(e.target.value) / 100,
                          })
                        }
                        className="w-full border p-1 rounded"
                        placeholder="0.05"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={rule.fixed_fee ?? 0}
                        onChange={(e) =>
                          updateRule(index, {
                            fixed_fee: Number(e.target.value),
                          })
                        }
                        className="w-full border p-1 rounded"
                        placeholder="0"
                      />
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
                        onClick={() => removeRule(index)}
                        className="text-slate-400 hover:text-red-600 p-1"
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
    </div>
  );
}
