import React from "react";
import { PartBrokerSelects } from "./PartBrokerSelects";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  settings: { [key: string]: any };
  onUpdate: (newSettings: { [key: string]: any }) => void;
  accountOptions: { id: string; name: string }[];
};

export const HoldingsTreeMapSettings = ({
  settings,
  onUpdate,
  accountOptions,
}: Props) => {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <label className="text-sm font-bold text-gray-700 whitespace-nowrap py-1">
          高さ
        </label>
        <div className="flex flex-wrap gap-2 flex-1">
          {[
            { value: 30, label: "小" },
            { value: 60, label: "中" },
            { value: 120, label: "大" },
            { value: 200, label: "特大" },
          ].map((option) => {
            const isChecked = (settings.height ?? 60) === option.value;
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
                  name="treeMapHeight"
                  checked={isChecked}
                  onChange={() => onUpdate({ height: option.value })}
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

export function TreeMapSkeleton() {
  return (
    <div className="flex h-full w-full gap-1 p-2">
      <Skeleton className="h-full w-1/2" />
      <div className="flex flex-col w-1/2 gap-1">
        <Skeleton className="h-2/3 w-full" />
        <div className="flex h-1/3 gap-1">
          <Skeleton className="h-full w-1/2" />
          <Skeleton className="h-full w-1/2" />
        </div>
      </div>
    </div>
  );
}
