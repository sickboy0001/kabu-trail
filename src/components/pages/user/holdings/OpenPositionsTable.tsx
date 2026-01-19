import { useMemo } from "react";
import Link from "next/link";
import type { Position } from "./HoldingsClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    const today = new Date();
    const todayTime = today.getTime();

    return positions
      .filter((p) => {
        if (!p.code) return false;
        const matchesText =
          p.name.includes(filterText) || p.code.includes(filterText);
        if (!matchesText) return false;
        if (startDate && p.entryDate < startDate) return false;
        if (endDate && p.entryDate > endDate) return false;
        return true;
      })
      .map((p) => ({
        ...p,
        entryTotal: p.entryPrice * p.quantity,
        valuationTotal: p.currentPrice * p.quantity,
        valuationPL:
          p.valuationPL ?? (p.currentPrice - p.entryPrice) * p.quantity,
        holdingPeriod: Math.floor(
          (todayTime - new Date(p.entryDate).getTime()) / (1000 * 60 * 60 * 24),
        ),
      }))
      .sort(
        (a, b) =>
          new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime(),
      );
  }, [positions, filterText, startDate, endDate]);

  if (filtered.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        保有中の銘柄はありません。
      </div>
    );
  }

  return (
    <Table>
      <TableHeader className="bg-slate-50">
        <TableRow>
          <TableHead className="p-2 font-medium text-slate-600">銘柄</TableHead>
          <TableHead className="p-2 font-medium text-slate-600">口座</TableHead>
          <TableHead className="p-2 font-medium text-slate-600">
            取得日
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right">
            取得株数
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right">
            取得単価
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right">
            取得金額
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right">
            保有期間
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right">
            現在値
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right">
            評価額
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right">
            評価損益
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((item) => {
          const isValuationPositive = (item.valuationPL ?? 0) >= 0;

          return (
            <TableRow
              key={item.id}
              className="hover:bg-slate-50 transition-colors"
            >
              <TableCell className="p-2">
                <Link href={`/stock?code=${item.code}`} className="block group">
                  <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {item.name}
                  </div>
                  <div className="text-xs text-slate-500 group-hover:text-blue-500 transition-colors">
                    {item.code}
                  </div>
                </Link>
              </TableCell>
              <TableCell className="p-2">
                <span className="rounded text-xs font-medium bg-slate-100 text-slate-600">
                  {item.accountName}
                </span>
              </TableCell>
              <TableCell className="p-2 text-slate-600">
                {item.entryDate}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                {item.quantity.toLocaleString()}
                {item.entryType === "STOCK_SPLIT" && (
                  <span className="text-xs text-teal-600 ml-1">(分割)</span>
                )}
                {item.entryType === "STOCK_TRANSFER_IN" && (
                  <span className="text-xs text-teal-600 ml-1">(入庫)</span>
                )}
                {item.entryType === "BUY" && (
                  <span className="text-xs text-blue-600 ml-1">(購入)</span>
                )}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                ¥{item.entryPrice.toLocaleString()}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                ¥{item.entryTotal.toLocaleString()}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                {item.holdingPeriod}日
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                {item.currentPrice
                  ? `¥${item.currentPrice.toLocaleString()}`
                  : "-"}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                {item.valuationTotal
                  ? `¥${item.valuationTotal.toLocaleString()}`
                  : "-"}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap">
                {item.valuationPL !== null ? (
                  <span
                    className={`font-bold ${
                      isValuationPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isValuationPositive ? "+" : ""}
                    {item.valuationPL.toLocaleString()}
                  </span>
                ) : (
                  "-"
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
