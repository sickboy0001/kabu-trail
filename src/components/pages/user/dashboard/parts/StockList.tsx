import React from "react";
import { Widget } from "../DashboardClient";

type Props = {
  widget: Widget;
};

// ダミーデータ
const STOCK_DATA = [
  {
    id: 1,
    code: "7203",
    name: "トヨタ自動車",
    account: "特定",
    purchaseDate: "2023/04/01",
    quantity: 100,
    purchasePrice: 2000,
    purchaseAmount: 200000,
    holdingPeriod: "320日",
    currentPrice: 3500,
    marketValue: 350000,
    pl: 150000,
    plPercent: 75.0,
  },
  {
    id: 2,
    code: "6758",
    name: "ソニーG",
    account: "NISA",
    purchaseDate: "2023/06/15",
    quantity: 50,
    purchasePrice: 12000,
    purchaseAmount: 600000,
    holdingPeriod: "245日",
    currentPrice: 13500,
    marketValue: 675000,
    pl: 75000,
    plPercent: 12.5,
  },
  {
    id: 3,
    code: "8306",
    name: "三菱UFJ",
    account: "特定",
    purchaseDate: "2022/11/10",
    quantity: 1000,
    purchasePrice: 800,
    purchaseAmount: 800000,
    holdingPeriod: "460日",
    currentPrice: 1400,
    marketValue: 1400000,
    pl: 600000,
    plPercent: 75.0,
  },
  {
    id: 4,
    code: "9984",
    name: "ソフトバンクG",
    account: "特定",
    purchaseDate: "2023/08/20",
    quantity: 100,
    purchasePrice: 6500,
    purchaseAmount: 650000,
    holdingPeriod: "180日",
    currentPrice: 6200,
    marketValue: 620000,
    pl: -30000,
    plPercent: -4.6,
  },
  {
    id: 5,
    code: "7974",
    name: "任天堂",
    account: "特定",
    purchaseDate: "2023/01/10",
    quantity: 100,
    purchasePrice: 5500,
    purchaseAmount: 550000,
    holdingPeriod: "400日",
    currentPrice: 8200,
    marketValue: 820000,
    pl: 270000,
    plPercent: 49.1,
  },
];

export function StockList({ widget }: Props) {
  return (
    <div className="w-full h-full overflow-auto">
      {/* PC表示: テーブル */}
      <table className="min-w-full text-left text-xs whitespace-nowrap hidden md:table">
        <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
          <tr>
            <th className="px-3 py-2 font-medium text-gray-500">銘柄</th>
            <th className="px-3 py-2 font-medium text-gray-500">口座</th>
            <th className="px-3 py-2 font-medium text-gray-500">取得日</th>
            <th className="px-3 py-2 font-medium text-gray-500 text-right">
              取得株数
            </th>
            <th className="px-3 py-2 font-medium text-gray-500 text-right">
              取得単価
            </th>
            <th className="px-3 py-2 font-medium text-gray-500 text-right">
              取得金額
            </th>
            <th className="px-3 py-2 font-medium text-gray-500 text-right">
              保有期間
            </th>
            <th className="px-3 py-2 font-medium text-gray-500 text-right">
              現在値
            </th>
            <th className="px-3 py-2 font-medium text-gray-500 text-right">
              評価額
            </th>
            <th className="px-3 py-2 font-medium text-gray-500 text-right">
              評価損益
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {STOCK_DATA.map((stock) => (
            <tr key={stock.id} className="hover:bg-gray-50">
              <td className="px-3 py-2">
                <div className="font-bold text-gray-700">{stock.name}</div>
                <div className="text-gray-400 text-[10px]">{stock.code}</div>
              </td>
              <td className="px-3 py-2 text-gray-600">{stock.account}</td>
              <td className="px-3 py-2 text-gray-600">{stock.purchaseDate}</td>
              <td className="px-3 py-2 text-right text-gray-700">
                {stock.quantity.toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right text-gray-700">
                {stock.purchasePrice.toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right text-gray-700">
                {stock.purchaseAmount.toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right text-gray-600">
                {stock.holdingPeriod}
              </td>
              <td className="px-3 py-2 text-right font-medium text-gray-700">
                {stock.currentPrice.toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right font-medium text-gray-700">
                {stock.marketValue.toLocaleString()}
              </td>
              <td
                className={`px-3 py-2 text-right font-bold ${stock.pl >= 0 ? "text-red-500" : "text-blue-500"}`}
              >
                {stock.pl > 0 ? "+" : ""}
                {stock.pl.toLocaleString()}
                <div className="text-[10px] font-normal">
                  ({stock.plPercent > 0 ? "+" : ""}
                  {stock.plPercent}%)
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* スマホ表示: カードリスト */}
      <div className="md:hidden space-y-2 p-1">
        {STOCK_DATA.map((stock) => (
          <div
            key={stock.id}
            className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm"
          >
            <div className="flex justify-between items-start mb-2 pb-2 border-b border-gray-50">
              <div>
                <div className="font-bold text-sm text-gray-800">
                  {stock.name}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-400">{stock.code}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                    {stock.account}
                  </span>
                </div>
              </div>
              <div
                className={`text-right ${stock.pl >= 0 ? "text-red-500" : "text-blue-500"}`}
              >
                <div className="font-bold text-sm">
                  {stock.pl > 0 ? "+" : ""}
                  {stock.pl.toLocaleString()}
                </div>
                <div className="text-[10px]">
                  ({stock.plPercent > 0 ? "+" : ""}
                  {stock.plPercent}%)
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>現在値</span>
                <span className="text-gray-700">
                  {stock.currentPrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>取得単価</span>
                <span className="text-gray-700">
                  {stock.purchasePrice.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>保有株数</span>
                <span className="text-gray-700">
                  {stock.quantity.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>評価額</span>
                <span className="text-gray-700">
                  {stock.marketValue.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
