"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { History, Wallet, Search, TrendingUp } from "lucide-react";

type Props = {
  user: User;
};

export default function CashflowsClient({ user }: Props) {
  const [activeTab, setActiveTab] = useState<"trade" | "cash" | "history">(
    "trade"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            取引・入出金管理
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            日々の取引記録、配当金、入出金の管理を行います。
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setActiveTab("trade")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "trade"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <TrendingUp size={18} />
          株式取引登録
        </button>
        <button
          onClick={() => setActiveTab("cash")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "cash"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <Wallet size={18} />
          入出金・配当記録
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "history"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          <History size={18} />
          履歴参照
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {activeTab === "trade" && <TradeRegistrationForm />}
        {activeTab === "cash" && <CashRegistrationForm />}
        {activeTab === "history" && <HistoryView />}
      </div>
    </div>
  );
}

function TradeRegistrationForm() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <TrendingUp className="text-blue-500" size={20} />
        株式取引の登録
      </h2>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              取引口座
            </label>
            <select className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
              <option value="">選択してください</option>
              <option value="1">SBI証券 - 特定</option>
              <option value="2">楽天証券 - NISA</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              約定日
            </label>
            <input
              type="date"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              銘柄コード / 銘柄名
            </label>
            <input
              type="text"
              placeholder="例: 7203 トヨタ自動車"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              取引区分
            </label>
            <div className="flex flex-wrap gap-4 mt-1">
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="side"
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">現物買</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="side"
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-slate-700">現物売</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="side"
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">信用建</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                <input
                  type="radio"
                  name="side"
                  className="text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-slate-700">信用埋</span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              数量 (株)
            </label>
            <input
              type="number"
              placeholder="100"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              単価 (円)
            </label>
            <input
              type="number"
              placeholder="1000"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              手数料 (税込)
            </label>
            <input
              type="number"
              placeholder="0"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-colors w-full md:w-auto">
            取引を登録する
          </button>
        </div>
      </form>
    </div>
  );
}

function CashRegistrationForm() {
  return (
    <div className="max-w-3xl">
      <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
        <Wallet className="text-green-600" size={20} />
        入出金・配当の記録
      </h2>
      <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              対象口座
            </label>
            <select className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white">
              <option value="">選択してください</option>
              <option value="1">SBI証券 - 特定</option>
              <option value="2">銀行口座</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              日付
            </label>
            <input
              type="date"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            種別
          </label>
          <div className="flex flex-wrap gap-4 mt-1">
            <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
              <input
                type="radio"
                name="cashType"
                className="text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-slate-700">入金</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
              <input
                type="radio"
                name="cashType"
                className="text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-slate-700">出金</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
              <input
                type="radio"
                name="cashType"
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">配当金・分配金</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
              <input
                type="radio"
                name="cashType"
                className="text-slate-600 focus:ring-slate-500"
              />
              <span className="text-sm text-slate-700">その他（利子など）</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              金額 (円)
            </label>
            <input
              type="number"
              placeholder="10000"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              摘要 / メモ
            </label>
            <input
              type="text"
              placeholder="例: 12月分給与振替"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-colors w-full md:w-auto">
            記録する
          </button>
        </div>
      </form>
    </div>
  );
}

function HistoryView() {
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <History className="text-slate-500" size={20} />
          履歴一覧
        </h2>
        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="検索..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg border-slate-200">
        <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-medium text-slate-600">日付</th>
              <th className="p-4 font-medium text-slate-600">口座</th>
              <th className="p-4 font-medium text-slate-600">区分</th>
              <th className="p-4 font-medium text-slate-600">銘柄/摘要</th>
              <th className="p-4 font-medium text-slate-600 text-right">
                数量
              </th>
              <th className="p-4 font-medium text-slate-600 text-right">
                単価/金額
              </th>
              <th className="p-4 font-medium text-slate-600 text-right">
                手数料
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {/* Empty State */}
            <tr>
              <td colSpan={7} className="p-12 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center gap-2">
                  <History className="text-slate-300" size={48} />
                  <p>履歴データはありません。</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
