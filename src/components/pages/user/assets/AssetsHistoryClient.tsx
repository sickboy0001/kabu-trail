"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { ArrowUp, ArrowDown } from "lucide-react";
import { sampleTransactions, accounts } from "./sampleData";

type Props = {
  user: User;
};

export default function AssetsHistoryClient({ user }: Props) {
  const [filterText, setFilterText] = useState("");

  const filteredTransactions = sampleTransactions
    .filter((item) => {
      const search = filterText.toLowerCase();
      return (
        item.transaction_date.includes(search) ||
        (item.memo && item.memo.toLowerCase().includes(search)) ||
        (item.stock_code && item.stock_code.toLowerCase().includes(search)) ||
        item.transaction_type.includes(search)
      );
    })
    .sort((a, b) => {
      return (
        a.transaction_date.localeCompare(b.transaction_date) || a.id - b.id
      );
    });

  let runningBalance = 0;
  const displayHistory = filteredTransactions.map((item) => {
    runningBalance += item.amount;
    return { ...item, calculatedBalance: runningBalance };
  });

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">資産推移</h1>
      </div>
      <div>
        この表は「現金の動き（キャッシュフロー）」を追うのに適しています。
        <p>取引の連鎖:</p>
        12/18の川崎重工業の売却益を原資にライトアップを購入し、さらに12/23にはゲオの売却益と合わせてソフトバンクを購入…といった、資産の「入れ替え」の流れが明確です。
        <p>残高の管理:</p>
        右端の「残高」列を見ることで、常に買い付け余力がいくらあるのかがリアルタイムで把握できています。
      </div>

      {/* 金銭残高明細 */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        {/* PC版: テーブル表示 */}
        <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4">口座</th>
                <th className="p-4">日付</th>
                <th className="p-4">取引区分</th>
                <th className="p-4">銘柄コード</th>
                <th className="p-4">摘要</th>
                <th className="p-4 text-right">精算金額</th>
                <th className="p-4 text-right">残高 (合算)</th>
              </tr>
            </thead>
            <tbody>
              {displayHistory.map((item, index) => {
                const account = accounts.find((a) => a.id === item.account_id);
                const current = item.calculatedBalance;
                const prev =
                  index > 0
                    ? displayHistory[index - 1].calculatedBalance
                    : null;
                let trend = null;
                if (current !== null && prev !== null) {
                  if (current > prev) trend = "up";
                  if (current < prev) trend = "down";
                }

                return (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="p-4 text-slate-600">
                      {account?.name || item.account_id}
                    </td>
                    <td className="p-4">{item.transaction_date}</td>
                    <td className="p-4">{item.transaction_type}</td>
                    <td className="p-4 font-mono text-slate-500">
                      {item.stock_code || "-"}
                    </td>
                    <td className="p-4 font-medium">{item.memo}</td>
                    <td
                      className={`p-4 text-right font-mono ${
                        item.amount > 0
                          ? "text-green-600"
                          : item.amount < 0
                            ? "text-red-600"
                            : ""
                      }`}
                    >
                      {item.amount > 0 ? "+" : ""}
                      {item.amount.toLocaleString()}
                    </td>
                    <td className="p-4 text-right font-mono">
                      <div className="flex items-center justify-end gap-1">
                        {trend === "up" && (
                          <ArrowUp size={14} className="text-green-600" />
                        )}
                        {trend === "down" && (
                          <ArrowDown size={14} className="text-red-600" />
                        )}
                        <span
                          className={
                            trend === "up"
                              ? "text-green-600"
                              : trend === "down"
                                ? "text-red-600"
                                : ""
                          }
                        >
                          {item.calculatedBalance.toLocaleString()}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
