import React from "react";
import { PartBrokerSelects } from "./PartBrokerSelects";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  settings: { [key: string]: any };
  onUpdate: (newSettings: { [key: string]: any }) => void;
  accountOptions: { id: string; name: string }[];
};

export const HoldingsListSettings = ({
  settings,
  onUpdate,
  accountOptions,
}: Props) => {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <label className="text-sm font-bold text-gray-700 whitespace-nowrap py-1">
          表示行数
        </label>
        <div className="flex flex-wrap gap-2 flex-1">
          {[
            { value: 3, label: "3行" },
            { value: 5, label: "5行" },
            { value: 7, label: "7行" },
            { value: "all", label: "すべて" },
          ].map((option) => {
            const isChecked = (settings.rowCount ?? "all") === option.value;
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
                  name="rowCount"
                  checked={isChecked}
                  onChange={() => onUpdate({ rowCount: option.value })}
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

export function HoldingsListSkeleton() {
  return (
    <div className="flex w-full flex-col px-3 py-2 h-full justify-center">
      <div className="flex gap-2 mb-1.5 border-b border-gray-200 pb-1">
        <Skeleton className="h-2 w-16" />
        <Skeleton className="h-2 w-12" />
        <Skeleton className="h-2 w-12" />
        <Skeleton className="h-2 flex-1" />
      </div>
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div className="flex gap-2" key={i}>
            <Skeleton className="h-2 w-12" />
            <Skeleton className="h-2 w-16" />
            <Skeleton className="h-2 w-10" />
            <Skeleton className="h-2 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}
