import React from "react";

type Props = {
  targetBuckets?: string[];
  onChange: (newBuckets: string[]) => void;
  accountOptions: { id: string; name: string }[];
};

export const PartBrokerSelects = ({
  targetBuckets = [],
  onChange,
  accountOptions,
}: Props) => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-start gap-2">
        <label className="text-sm font-bold text-gray-700 whitespace-nowrap py-1">
          表示対象の口座
        </label>
        <div className="flex flex-wrap gap-2 flex-1">
          {accountOptions.length === 0 ? (
            <div className="text-sm text-gray-400 py-1">
              選択可能な口座が見つかりません
            </div>
          ) : (
            accountOptions.map((account) => {
              const isChecked = targetBuckets.includes(account.id);
              return (
                <label
                  key={account.id}
                  className={`flex items-center gap-1.5 cursor-pointer border rounded px-2 py-1 text-sm select-none transition-colors ${
                    isChecked
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      const newTargets = e.target.checked
                        ? [...targetBuckets, account.id]
                        : targetBuckets.filter((id) => id !== account.id);
                      onChange(newTargets);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>{account.name}</span>
                </label>
              );
            })
          )}
        </div>
      </div>
      <p className="text-[10px] text-gray-400 text-right">
        ※未選択時は全ての口座が集計対象
      </p>
    </div>
  );
};
