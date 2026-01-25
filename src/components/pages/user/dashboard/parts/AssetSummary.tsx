import React from "react";
import { Widget } from "../DashboardClient";
import { Position, ClosedTrade } from "@/hooks/useHoldingsData";
import { MarkdownTooltip } from "@/components/ui/MarkdownTooltip";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  VALUATION_TOOLTIP_MD,
  PL_TOOLTIP_MD,
  PL_PERCENT_TOOLTIP_MD,
} from "@/constants/content";

type Props = {
  widget: Widget;
  positions?: Position[];
  closedTrades?: ClosedTrade[];
};

export function AssetSummary({
  widget,
  positions = [],
  closedTrades = [],
}: Props) {
  const targetBuckets = widget.settings.targetBuckets as string[] | undefined;
  const filteredPositions =
    targetBuckets && targetBuckets.length > 0
      ? positions.filter(
          (p) => p.bucketId && targetBuckets.includes(p.bucketId),
        )
      : positions;

  // 評価額の計算
  const totalInvestment = filteredPositions.reduce(
    (sum, p) => sum + p.entryPrice * p.quantity,
    0,
  );
  const currentMarketValue = filteredPositions.reduce(
    (sum, p) => sum + p.currentPrice * p.quantity,
    0,
  );
  const totalUnrealizedPL = currentMarketValue - totalInvestment;

  // 損益率
  const plPercent =
    totalInvestment !== 0 ? (totalUnrealizedPL / totalInvestment) * 100 : 0;

  const isPositive = totalUnrealizedPL >= 0;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full">
        <h3 className="text-xs sm:text-sm font-bold text-gray-500 mb-2 border-b border-gray-100 pb-1">
          {widget.title}
        </h3>
        <div className="flex flex-col justify-center flex-1 gap-1 px-2">
          {/* メイン: 株式評価額 */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs text-gray-500">株式評価額</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info
                    size={12}
                    className="text-gray-400 cursor-pointer hover:text-gray-600"
                  />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs p-3 text-left font-normal">
                  <MarkdownTooltip
                    content={VALUATION_TOOLTIP_MD}
                    className="text-xs"
                  />
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="text-sm sm:text-2xl font-bold text-gray-800 tracking-tight">
              ¥{currentMarketValue.toLocaleString()}
            </div>
          </div>

          {/* サブ: 詳細リスト */}
          <div className="flex flex-col gap-1 border-t border-gray-100 pt-1">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center text-sm">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">評価損益</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info
                      size={12}
                      className="text-gray-400 cursor-pointer hover:text-gray-600"
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-3 text-left font-normal">
                    <MarkdownTooltip
                      content={PL_TOOLTIP_MD}
                      className="text-xs"
                    />
                  </TooltipContent>
                </Tooltip>
              </div>
              <div
                className={`font-bold self-end sm:self-auto ${isPositive ? "text-red-500" : "text-blue-500"}`}
              >
                {isPositive ? "+" : ""}
                {totalUnrealizedPL.toLocaleString()}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center text-sm">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">損益率</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info
                      size={12}
                      className="text-gray-400 cursor-pointer hover:text-gray-600"
                    />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-3 text-left font-normal">
                    <MarkdownTooltip
                      content={PL_PERCENT_TOOLTIP_MD}
                      className="text-xs"
                    />
                  </TooltipContent>
                </Tooltip>
              </div>
              <div
                className={`font-bold self-end sm:self-auto ${isPositive ? "text-red-500" : "text-blue-500"}`}
              >
                {isPositive ? "+" : ""}
                {plPercent.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
