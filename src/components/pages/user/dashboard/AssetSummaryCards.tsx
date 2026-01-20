import { Wallet, TrendingUp, DollarSign } from "lucide-react";
import { AccountSummary } from "./DashboardClient";

// 表示項目の定義
export const SUMMARY_ITEMS_DEF = [
  { key: "totalAssets", label: "資産情報" },
  { key: "totalGainLoss", label: "評価損益合計" },
  { key: "dayChange", label: "前日比" },
] as const;

export type SummaryKey = (typeof SUMMARY_ITEMS_DEF)[number]["key"];
export type AssetSummaryVisibility = Record<SummaryKey, boolean>;

type Props = {
  summary: AccountSummary;
  columnCount?: number;
  visibility?: AssetSummaryVisibility;
};

export default function AssetSummaryCards({
  summary,
  columnCount = 3,
  visibility = {
    totalAssets: true,
    totalGainLoss: true,
    dayChange: true,
  } as AssetSummaryVisibility,
}: Props) {
  const formatYen = (num: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(num);
  };

  const formatPercent = (num: number) => {
    return num.toFixed(2) + "%";
  };

  const visibleCount = SUMMARY_ITEMS_DEF.filter(
    (item) => visibility[item.key],
  ).length;

  const effectiveCols =
    visibleCount > 0 ? Math.min(columnCount, visibleCount) : 1;

  const gridColsClass =
    {
      1: "md:grid-cols-1",
      2: "md:grid-cols-2",
      3: "md:grid-cols-3",
      4: "md:grid-cols-4",
      5: "md:grid-cols-5",
      6: "md:grid-cols-6",
    }[effectiveCols] || "md:grid-cols-3";

  return (
    <div className={`grid grid-cols-1 ${gridColsClass} gap-6`}>
      {/* 総資産 */}
      {visibility.totalAssets && (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Wallet size={20} />
            </div>
            <p className="text-slate-500 text-sm font-medium">資産情報</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {formatYen(summary.totalAssets)}
          </p>
          <div className="mt-2 text-sm text-slate-500 flex justify-between">
            <span>現金: {formatYen(summary.cashBalance)}</span>
            <span>株式: {formatYen(summary.stockValue)}</span>
          </div>
        </div>
      )}

      {/* 評価損益 */}
      {visibility.totalGainLoss && (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-2 rounded-lg ${
                summary.totalGainLoss >= 0
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              <TrendingUp size={20} />
            </div>
            <p className="text-slate-500 text-sm font-medium">評価損益合計</p>
          </div>
          <div className="flex items-baseline gap-2">
            <p
              className={`text-3xl font-bold ${
                summary.totalGainLoss >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {summary.totalGainLoss >= 0 ? "+" : ""}
              {formatYen(summary.totalGainLoss)}
            </p>
            <span
              className={`text-sm font-medium ${
                summary.totalGainLoss >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ({summary.totalGainLoss >= 0 ? "+" : ""}
              {formatPercent(summary.totalGainLossPercent)})
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">取得額との比較</p>
        </div>
      )}

      {/* 前日比（ダミー） */}
      {visibility.dayChange && (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
              <DollarSign size={20} />
            </div>
            <p className="text-slate-500 text-sm font-medium">
              前日比 (ダミー)
            </p>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-slate-900">+¥12,500</p>
            <span className="text-sm font-medium text-green-600">(+0.45%)</span>
          </div>
          <p className="mt-2 text-sm text-slate-500">前営業日との比較</p>
        </div>
      )}
    </div>
  );
}
