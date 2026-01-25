import React from "react";
import { PartBrokerSelects } from "./PartBrokerSelects";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  settings: { [key: string]: any };
  onUpdate: (newSettings: { [key: string]: any }) => void;
  accountOptions: { id: string; name: string }[];
};

export const DayOverDaySettings = ({
  settings,
  onUpdate,
  accountOptions,
}: Props) => {
  return (
    <PartBrokerSelects
      targetBuckets={settings.targetBuckets}
      onChange={(newBuckets) => onUpdate({ targetBuckets: newBuckets })}
      accountOptions={accountOptions}
    />
  );
};

export function DayOverDaySkeleton() {
  return (
    <div className="flex flex-col justify-center h-full px-4 gap-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-36" />
    </div>
  );
}
