import React from "react";
import { PartBrokerSelects } from "./PartBrokerSelects";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  settings: { [key: string]: any };
  onUpdate: (newSettings: { [key: string]: any }) => void;
  accountOptions: { id: string; name: string }[];
};

export const HoldingsPieSettings = ({
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

export function HoldingsPieSkeleton() {
  return (
    <div className="flex items-center justify-center h-full">
      <Skeleton className="h-12 w-12 rounded-full" />
    </div>
  );
}
