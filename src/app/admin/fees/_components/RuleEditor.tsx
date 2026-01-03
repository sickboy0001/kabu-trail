"use client";

import { useState } from "react";
import { Plus, Trash2, Save, History } from "lucide-react";

export default function RuleEditor({ templateId, initialRules }: any) {
  const [rules, setRules] = useState(initialRules || []);

  const addRow = () => {
    const newRow = {
      id: Math.random(), // 仮のID
      threshold_amount: 0,
      fee_rate: 0,
      fixed_fee: 0,
      is_daily_sum: false,
    };
    setRules([...rules, newRow]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold">ルール編集</h1>
          <p className="text-sm text-slate-500">
            Template ID: {templateId} の手数料ロジックを設定します
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-slate-50 text-sm">
            <History className="w-4 h-4" /> 履歴
          </button>
          <button
            onClick={() => alert("保存処理を実行します")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
          >
            <Save className="w-4 h-4" /> 設定を保存
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
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
              <tr key={rule.id} className="hover:bg-slate-50">
                <td className="p-3">
                  <input
                    type="number"
                    defaultValue={rule.threshold_amount}
                    className="w-full border p-1 rounded"
                    placeholder="1,000,000"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    step="0.001"
                    defaultValue={rule.fee_rate * 100}
                    className="w-full border p-1 rounded"
                    placeholder="0.05"
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    defaultValue={rule.fixed_fee}
                    className="w-full border p-1 rounded"
                    placeholder="0"
                  />
                </td>
                <td className="p-3 text-center">
                  <input
                    type="checkbox"
                    defaultChecked={rule.is_daily_sum}
                    className="w-4 h-4"
                  />
                </td>
                <td className="p-3 text-right">
                  <button className="text-slate-400 hover:text-red-600 p-1">
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
