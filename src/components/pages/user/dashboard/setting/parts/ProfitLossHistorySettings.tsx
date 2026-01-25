import React from "react";
import { PartBrokerSelects } from "./PartBrokerSelects";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  settings: { [key: string]: any };
  onUpdate: (newSettings: { [key: string]: any }) => void;
  accountOptions: { id: string; name: string }[];
};

export const ProfitLossHistorySettings = ({
  settings,
  onUpdate,
  accountOptions,
}: Props) => {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <label className="text-sm font-bold text-gray-700 whitespace-nowrap py-1">
          期間
        </label>
        <div className="flex flex-wrap gap-2 flex-1">
          {[
            { value: 6, label: "6ヶ月" },
            { value: 12, label: "1年" },
            { value: 24, label: "2年" },
          ].map((option) => {
            const isChecked = (settings.months ?? 12) === option.value;
            return (
              <label
                key={option.value}
                className={`flex items-center gap-1.5 cursor-pointer border rounded px-2 py-1 text-sm select-none transition-colors ${
                  isChecked
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="plHistoryMonths"
                  checked={isChecked}
                  onChange={() => onUpdate({ months: option.value })}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex items-start gap-2">
        <label className="text-sm font-bold text-gray-700 whitespace-nowrap py-1">
          基準
        </label>
        <div className="flex flex-wrap gap-2 flex-1">
          {[
            { value: "current", label: "当月" },
            { value: "this_year_end", label: "今年12月" },
            { value: "prev_year_end", label: "前年12月" },
          ].map((option) => {
            const isChecked =
              (settings.baseDateType ?? "current") === option.value;
            return (
              <label
                key={option.value}
                className={`flex items-center gap-1.5 cursor-pointer border rounded px-2 py-1 text-sm select-none transition-colors ${
                  isChecked
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="plHistoryBaseDate"
                  checked={isChecked}
                  onChange={() => onUpdate({ baseDateType: option.value })}
                  className="border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>
      <PartBrokerSelects
        targetBuckets={settings.targetBuckets}
        onChange={(newBuckets) => onUpdate({ targetBuckets: newBuckets })}
        accountOptions={accountOptions}
      />
    </div>
  );
};

export function ProfitLossHistorySkeleton({
  settings,
}: {
  settings?: { [key: string]: any };
}) {
  const months = settings?.months ?? 12;
  return (
    <div className="flex items-end justify-between h-full px-4 pb-2 gap-1">
      {Array.from({ length: months }).map((_, i) => (
        <Skeleton
          key={i}
          className={`w-full ${
            ["h-1/3", "h-2/3", "h-1/2", "h-full", "h-3/4"][i % 5]
          }`}
        />
      ))}
    </div>
  );
}
