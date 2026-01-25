import React, { useState } from "react";
import { Widget } from "../DashboardClient";
import { Position } from "@/hooks/useHoldingsData";
import OpenPositionsTable from "../../holdings/OpenPositionsTable";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  widget: Widget;
  positions?: Position[];
};

export function HoldingsList({ widget, positions = [] }: Props) {
  const [page, setPage] = useState(1);
  const targetBuckets = widget.settings.targetBuckets as string[] | undefined;
  const rowCount = widget.settings.rowCount as number | undefined;
  const filteredPositions =
    targetBuckets && targetBuckets.length > 0
      ? positions.filter(
          (p) => p.bucketId && targetBuckets.includes(p.bucketId),
        )
      : positions;

  // 取得日の降順（新しい順）にソート
  const sortedPositions = [...filteredPositions].sort((a, b) => {
    const dateA = new Date(a.entryDate).getTime();
    const dateB = new Date(b.entryDate).getTime();
    return dateB - dateA;
  });

  if (!sortedPositions || sortedPositions.length === 0) {
    return (
      <div className="w-full h-full flex flex-col">
        <h3 className="text-xs sm:text-sm font-bold text-gray-500 mb-2 border-b border-gray-100 pb-1">
          {widget.title}
        </h3>
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          保有銘柄がありません
        </div>
      </div>
    );
  }

  const pageSize = rowCount ?? 0;
  const enablePagination = pageSize > 0;
  const totalPages = enablePagination
    ? Math.ceil(sortedPositions.length / pageSize)
    : 1;

  const currentPage = Math.min(Math.max(1, page), totalPages);

  const displayPositions = enablePagination
    ? sortedPositions.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      )
    : sortedPositions;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 border-b border-gray-100 pb-1">
        <h3 className="text-xs sm:text-sm font-bold text-gray-500">
          {widget.title}
        </h3>
        {enablePagination && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {currentPage} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
      <OpenPositionsTable positions={displayPositions} />
    </div>
  );
}
