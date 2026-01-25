// d:\work\dev\spa\kabu-trail\src\components\pages\user\dashboard\PlaceholderWidget.tsx
import React from "react";
import { Widget } from "./DashboardClient";

// パーツコンポーネントのインポート（実装後にコメントアウトを解除してください）
import { AssetSummary } from "./parts/AssetSummary";
import { ProfitLossSummary } from "./parts/ProfitLossSummary";
import { DayOverDay } from "./parts/DayOverDay";
import { AssetHistory } from "./parts/AssetHistory";
import { HoldingsPie } from "./parts/HoldingsPie";
import { HoldingsList } from "./parts/HoldingsList";
import { HoldingsTreeMap } from "./parts/HoldingsTreeMap";
import { ProfitLossHistory } from "./parts/ProfitLossHistory";

import { Position, ClosedTrade } from "@/hooks/useHoldingsData";
import { AccountTransaction } from "@/hooks/useTransactionData";

export const PlaceholderWidget = ({
  widget,
  showDebugInfo,
  positions,
  closedTrades,
  transactions,
}: {
  widget: Widget;
  showDebugInfo?: boolean;
  positions?: Position[];
  closedTrades?: ClosedTrade[];
  transactions?: AccountTransaction[];
}) => {
  // 共通のウィジェットラッパー（タイトルと枠）
  const WidgetWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="h-full min-h-40 p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col">
      <div className="grow flex flex-col h-full overflow-hidden">
        {children}
      </div>
      {showDebugInfo && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <pre className="text-[10px] text-gray-500 font-mono overflow-auto max-h-32 bg-gray-50 p-2 rounded">
            {JSON.stringify(widget, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );

  // ウィジェットの中身をレンダリング
  const renderWidgetContent = () => {
    switch (widget.type) {
      case "asset_summary":
        return (
          <AssetSummary
            widget={widget}
            positions={positions}
            closedTrades={closedTrades}
          />
        );

      case "profit_loss_summary":
        return (
          <ProfitLossSummary
            widget={widget}
            positions={positions}
            closedTrades={closedTrades}
          />
        );

      case "day_over_day":
        return <DayOverDay widget={widget} />;

      case "asset_history":
        return <AssetHistory widget={widget} transactions={transactions} />;
      //portfolio_pie
      case "holdings_pie":
        return <HoldingsPie widget={widget} positions={positions} />;

      case "holdings_list":
        return <HoldingsList widget={widget} positions={positions} />;

      case "holdings_tree_map":
      case "tree_map":
        return <HoldingsTreeMap widget={widget} positions={positions} />;
      case "profit_loss_history":
        return (
          <ProfitLossHistory widget={widget} closedTrades={closedTrades} />
        );
      default:
        return (
          <div className="text-center text-gray-400 italic">
            {widget.type} (cols: {widget.cols})
          </div>
        );
    }
  };

  return <WidgetWrapper>{renderWidgetContent()}</WidgetWrapper>;
};
