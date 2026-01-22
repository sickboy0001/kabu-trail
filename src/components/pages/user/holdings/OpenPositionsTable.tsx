import React, { useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Position } from "./HoldingsClient";

type Props = {
  filterText: string;
  positions: Position[];
  startDate: string;
  endDate: string;
};

export default function OpenPositionsTable({
  filterText,
  positions,
  startDate,
  endDate,
}: Props) {
  const filtered = useMemo(() => {
    return positions.filter((p) => {
      if (startDate && p.entryDate < startDate) return false;
      if (endDate && p.entryDate > endDate) return false;
      if (filterText) {
        const lower = filterText.toLowerCase();
        return (
          p.name.toLowerCase().includes(lower) ||
          p.code.toLowerCase().includes(lower)
        );
      }
      return true;
    });
  }, [positions, filterText, startDate, endDate]);

  if (filtered.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500">
        該当する保有銘柄はありません。
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* PC表示: テーブル */}
      <div className="hidden md:block overflow-x-auto">
        <Table className="min-w-max">
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="whitespace-nowrap">銘柄</TableHead>
              <TableHead className="whitespace-nowrap">口座</TableHead>
              <TableHead className="whitespace-nowrap text-right">
                数量
              </TableHead>
              <TableHead className="whitespace-nowrap text-right">
                取得単価
              </TableHead>
              <TableHead className="whitespace-nowrap text-right">
                現在値
              </TableHead>
              <TableHead className="whitespace-nowrap text-right">
                評価額
              </TableHead>
              <TableHead className="whitespace-nowrap text-right">
                評価損益
              </TableHead>
              <TableHead className="whitespace-nowrap">取得日</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((pos) => {
              const marketValue = pos.currentPrice * pos.quantity;
              const pl = pos.valuationPL ?? 0;
              const plPercent =
                pos.entryPrice * pos.quantity !== 0
                  ? (pl / (pos.entryPrice * pos.quantity)) * 100
                  : 0;
              const isPositive = pl >= 0;

              return (
                <TableRow key={pos.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Link
                      href={`/stock?code=${pos.code}`}
                      className="font-bold text-slate-800 hover:text-blue-600 block"
                    >
                      {pos.name}
                    </Link>
                    <span className="text-xs text-slate-500">{pos.code}</span>
                  </TableCell>
                  <TableCell>{pos.accountName}</TableCell>
                  <TableCell className="text-right font-mono">
                    {pos.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {pos.entryPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {pos.currentPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {marketValue.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className={`font-bold ${isPositive ? "text-blue-600" : "text-red-600"}`}
                    >
                      {isPositive ? "+" : ""}
                      {pl.toLocaleString()}
                    </div>
                    <div
                      className={`text-xs ${isPositive ? "text-blue-600" : "text-red-600"}`}
                    >
                      ({isPositive ? "+" : ""}
                      {plPercent.toFixed(2)}%)
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-500 text-xs">
                    {pos.entryDate}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* スマホ表示: カードリスト */}
      <div className="md:hidden space-y-3">
        {filtered.map((pos) => {
          const marketValue = pos.currentPrice * pos.quantity;
          const pl = pos.valuationPL ?? 0;
          const plPercent =
            pos.entryPrice * pos.quantity !== 0
              ? (pl / (pos.entryPrice * pos.quantity)) * 100
              : 0;
          const isPositive = pl >= 0;

          return (
            <div
              key={pos.id}
              className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm"
            >
              <div className="flex justify-between items-start mb-2 pb-2 border-b border-slate-50">
                <div>
                  <Link
                    href={`/stock?code=${pos.code}`}
                    className="font-bold text-slate-800 text-sm block"
                  >
                    {pos.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{pos.code}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {pos.accountName}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`font-bold text-sm ${isPositive ? "text-blue-600" : "text-red-600"}`}
                  >
                    {isPositive ? "+" : ""}
                    {pl.toLocaleString()}
                  </div>
                  <div
                    className={`text-[10px] ${isPositive ? "text-blue-600" : "text-red-600"}`}
                  >
                    ({isPositive ? "+" : ""}
                    {plPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">数量</span>
                  <span>{pos.quantity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">取得単価</span>
                  <span>{pos.entryPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">現在値</span>
                  <span>{pos.currentPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">評価額</span>
                  <span>{marketValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between col-span-2 pt-1 mt-1 border-t border-slate-50">
                  <span className="text-slate-400">取得日</span>
                  <span>{pos.entryDate}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
