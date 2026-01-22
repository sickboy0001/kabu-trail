import React from "react";
import { Widget } from "../DashboardClient";

type Props = {
  widget: Widget;
};

// ダミーデータ
const ASSET_DATA = {
  cash: 5240000,
  stockValue: 14500000,
};

export function AssetSummary({ widget }: Props) {
  const totalAssets = ASSET_DATA.cash + ASSET_DATA.stockValue;

  return (
    <div className="flex flex-col gap-4 p-2 h-full justify-center">
      {/* 総資産 */}
      <div>
        <div className="text-sm text-gray-500 mb-1">総資産</div>
        <div className="text-3xl font-bold text-gray-800 tracking-tight">
          {totalAssets.toLocaleString()}
          <span className="text-sm font-normal text-gray-500 ml-1">円</span>
        </div>
      </div>

      {/* 内訳 */}
      <div className="flex flex-col gap-3 border-t border-gray-100 pt-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">保有銘柄</div>
          <div className="font-medium text-gray-800">
            {ASSET_DATA.stockValue.toLocaleString()} 円
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">現金</div>
          <div className="font-medium text-gray-800">
            {ASSET_DATA.cash.toLocaleString()} 円
          </div>
        </div>
      </div>
    </div>
  );
}
