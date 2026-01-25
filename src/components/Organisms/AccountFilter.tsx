"use client";

import { useState } from "react";
import { Filter, Check } from "lucide-react";

type Props = {
  accounts: string[];
  selectedAccounts: string[];
  onChange: (selectedAccounts: string[]) => void;
};

export default function AccountFilter({
  accounts,
  selectedAccounts,
  onChange,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccount = (account: string) => {
    if (selectedAccounts.includes(account)) {
      onChange(selectedAccounts.filter((a) => a !== account));
    } else {
      onChange([...selectedAccounts, account]);
    }
  };

  return (
    <>
      {/* Mobile: Dropdown Filter */}
      <div className="relative lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${
            selectedAccounts.length > 0
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Filter size={16} />
          <span>口座</span>
          {selectedAccounts.length > 0 && (
            <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
              {selectedAccounts.length}
            </span>
          )}
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute left-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg z-20 py-2">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <span className="text-xs font-bold text-slate-500">
                  口座を選択
                </span>
              </div>
              {accounts.map((account) => (
                <button
                  key={account}
                  onClick={() => toggleAccount(account)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between text-slate-700"
                >
                  <span>{account}</span>
                  {selectedAccounts.includes(account) && (
                    <Check size={16} className="text-blue-600" />
                  )}
                </button>
              ))}
              {accounts.length === 0 && (
                <div className="px-4 py-2 text-sm text-slate-400">
                  口座情報がありません
                </div>
              )}
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={() => onChange([])}
                  className="w-full text-left px-4 py-2 text-xs text-slate-500 hover:text-blue-600 hover:bg-slate-50"
                >
                  選択を解除 (すべて表示)
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Desktop: Inline Filter */}
      <div className="hidden lg:flex flex-wrap items-center gap-2">
        <span className="text-sm font-bold text-slate-600 mr-1">口座:</span>
        {accounts.map((account) => (
          <button
            key={account}
            onClick={() => toggleAccount(account)}
            className={`px-3 py-1.5 text-sm border rounded-full transition-colors ${
              selectedAccounts.includes(account)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {account}
          </button>
        ))}
        {selectedAccounts.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="ml-2 text-xs text-slate-500 hover:text-red-600 underline"
          >
            クリア
          </button>
        )}
      </div>
    </>
  );
}
