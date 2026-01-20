"use client";

import { User } from "@supabase/supabase-js";
import { useState } from "react";
import { Settings } from "lucide-react";
import AssetSummaryCards, {
  SUMMARY_ITEMS_DEF,
  AssetSummaryVisibility,
} from "./AssetSummaryCards";
import AssetHistoryChart from "./AssetHistoryChart";
import PortfolioPieChart from "./PortfolioPieChart";
import HoldingsTable from "./HoldingsTable";
import DashboardSettings, { DashboardItem } from "./setting/DashboardSettings";

type Props = {
  user: User;
};

// ダミーデータ型定義
export type Holding = {
  id: string;
  code: string;
  name: string;
  quantity: number;
  averagePrice: number; // 平均取得単価
  currentPrice: number; // 現在値
  previousClose: number; // 前日終値
};

export type AccountSummary = {
  totalAssets: number; // 総資産
  cashBalance: number; // 現金残高
  stockValue: number; // 株式評価額
  totalGainLoss: number; // 評価損益
  totalGainLossPercent: number; // 評価損益率
};

export default function DashboardClient({ user }: Props) {
  // ダミーデータ
  const holdings: Holding[] = [
    {
      id: "1",
      code: "7203",
      name: "トヨタ自動車",
      quantity: 100,
      averagePrice: 2800,
      currentPrice: 3150,
      previousClose: 3100,
    },
    {
      id: "2",
      code: "9984",
      name: "ソフトバンクG",
      quantity: 200,
      averagePrice: 6500,
      currentPrice: 6200,
      previousClose: 6100,
    },
    {
      id: "3",
      code: "8306",
      name: "三菱UFJ",
      quantity: 500,
      averagePrice: 1200,
      currentPrice: 1450,
      previousClose: 1460,
    },
    {
      id: "4",
      code: "7011",
      name: "三菱重工",
      quantity: 300,
      averagePrice: 1800,
      currentPrice: 2300,
      previousClose: 2250,
    },
    {
      id: "5",
      code: "5401",
      name: "日本製鉄",
      quantity: 200,
      averagePrice: 3000,
      currentPrice: 3500,
      previousClose: 3480,
    },
    {
      id: "6",
      code: "9432",
      name: "NTT",
      quantity: 1000,
      averagePrice: 150,
      currentPrice: 170,
      previousClose: 172,
    },
  ];

  // 集計計算
  const stockValue = holdings.reduce(
    (sum, h) => sum + h.currentPrice * h.quantity,
    0,
  );
  const acquisitionCost = holdings.reduce(
    (sum, h) => sum + h.averagePrice * h.quantity,
    0,
  );
  const cashBalance = 1500000; // 現金残高（ダミー）
  const totalAssets = stockValue + cashBalance;
  const totalGainLoss = stockValue - acquisitionCost;
  const totalGainLossPercent =
    acquisitionCost > 0 ? (totalGainLoss / acquisitionCost) * 100 : 0;

  const summary: AccountSummary = {
    totalAssets,
    cashBalance,
    stockValue,
    totalGainLoss,
    totalGainLossPercent,
  };

  // グラフ用のダミー資産推移データ
  const assetHistory = Array.from({ length: 12 }).map((_, i) => {
    const date = new Date();
    // 過去11ヶ月前から今月まで
    date.setMonth(date.getMonth() - (11 - i));
    const month = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}`;
    // ダミーの資産額を生成（少しずつ増えていく感じ）
    const asset =
      totalAssets * (0.8 + i * 0.02) + Math.random() * 200000 - 100000;
    return { month, 資産額: Math.round(asset) };
  });

  // ダッシュボード設定・レイアウト状態
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [layoutItems, setLayoutItems] = useState<DashboardItem[]>([
    { id: "summary", label: "資産サマリー", visible: true, colSpan: 4 },
    { id: "history", label: "資産推移チャート", visible: true, colSpan: 3 },
    { id: "pie", label: "ポートフォリオ", visible: true, colSpan: 1 },
    { id: "holdings", label: "保有銘柄一覧", visible: true, colSpan: 4 },
  ]);
  const [columnCount, setColumnCount] = useState(3);
  const [summaryVisibility, setSummaryVisibility] = useState<AssetSummaryVisibility>(
    {
      totalAssets: true,
      totalGainLoss: true,
      dayChange: true,
    },
  );

  const handleSaveSettings = (
    newItems: DashboardItem[],
    newColumnCount: number,
    newSummaryVisibility: Record<string, boolean>,
  ) => {
    setLayoutItems(newItems);
    setColumnCount(newColumnCount);
    setSummaryVisibility(newSummaryVisibility as AssetSummaryVisibility);
    setIsSettingsOpen(false);
  };

  const renderWidget = (id: string, className = "") => {
    switch (id) {
      case "summary":
        return (
          <AssetSummaryCards
            key="summary"
            summary={summary}
            columnCount={columnCount}
            visibility={summaryVisibility}
          />
        );
      case "history":
        return (
          <AssetHistoryChart
            key="history"
            data={assetHistory}
            className={className}
          />
        );
      case "pie":
        return (
          <PortfolioPieChart
            key="pie"
            holdings={holdings}
            className={className}
          />
        );
      case "holdings":
        return <HoldingsTable key="holdings" holdings={holdings} />;
      default:
        return null;
    }
  };

  const renderDashboardContent = () => {
    const visibleItems = layoutItems.filter((i) => i.visible);

    // Tailwindのクラス名を動的に生成せず、完全な文字列として定義することで
    // ビルド時に正しく検出されるようにします
    const getColSpanClass = (span?: number) => {
      switch (span) {
        case 1:
          return "md:col-span-1";
        case 2:
          return "md:col-span-2";
        case 3:
          return "md:col-span-3";
        default:
          return "md:col-span-4";
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            // className={`col-span-1 md:col-span-${item.colSpan || 4}`}
            className={`col-span-1 ${getColSpanClass(item.colSpan)}`}
          >
            {renderWidget(item.id, "h-full")}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">ダッシュボード</h1>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          title="ダッシュボード設定"
        >
          <Settings size={20} />
        </button>
      </div>

      {isSettingsOpen ? (
        <DashboardSettings
          initialItems={layoutItems}
          initialColumnCount={columnCount}
          initialSummaryVisibility={summaryVisibility}
          summaryItemDefs={SUMMARY_ITEMS_DEF}
          onSave={handleSaveSettings}
          onCancel={() => setIsSettingsOpen(false)}
        />
      ) : (
        renderDashboardContent()
      )}
    </div>
  );
}
