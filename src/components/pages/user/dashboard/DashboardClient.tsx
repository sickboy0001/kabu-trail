"use client";

import { User } from "@supabase/supabase-js";
import AssetSummaryCards from "./AssetSummaryCards";
import AssetHistoryChart from "./AssetHistoryChart";
import PortfolioPieChart from "./PortfolioPieChart";
import HoldingsTable from "./HoldingsTable";

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
    0
  );
  const acquisitionCost = holdings.reduce(
    (sum, h) => sum + h.averagePrice * h.quantity,
    0
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
      "0"
    )}`;
    // ダミーの資産額を生成（少しずつ増えていく感じ）
    const asset =
      totalAssets * (0.8 + i * 0.02) + Math.random() * 200000 - 100000;
    return { month, 資産額: Math.round(asset) };
  });

  return (
    <div className="space-y-6 md:space-y-8">
      {/* ヘッダー */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">ダッシュボード</h1>
      </div>

      {/* 資産サマリーカード */}
      <AssetSummaryCards summary={summary} />

      {/* グラフエリア */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AssetHistoryChart data={assetHistory} className="md:col-span-2" />
        <PortfolioPieChart holdings={holdings} />
      </div>

      {/* 保有銘柄一覧 */}
      <HoldingsTable holdings={holdings} />
    </div>
  );
}
