import { useMemo } from "react";
import type { Position, ClosedTrade } from "./PositionsClient";
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
  closedTrades: ClosedTrade[];
  startDate: string;
  endDate: string;
  showOpenPositions: boolean;
  showClosedTrades: boolean;
};

export default function PositionsTable({
  filterText,
  positions,
  closedTrades,
  startDate,
  endDate,
  showOpenPositions,
  showClosedTrades,
}: Props) {
  const allTrades = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const todayTime = new Date(todayStr).getTime();

    const openPositions = positions.map((p) => ({
      id: `open-${p.id}`,
      code: p.code,
      name: p.name,
      accountName: p.accountName,
      entryDate: p.entryDate,
      quantity: p.quantity,
      entryPrice: p.entryPrice,
      entryTotal: p.entryPrice * p.quantity,
      currentPrice: p.currentPrice,
      exitPrice: null,
      closeDate: null,
      exitTotal: null,
      realizedPL: null,
      valuationTotal: p.currentPrice * p.quantity,
      valuationPL: (p.currentPrice - p.entryPrice) * p.quantity,
      holdingPeriod: Math.floor(
        (todayTime - new Date(p.entryDate).getTime()) / (1000 * 60 * 60 * 24)
      ),
    }));

    const closed = closedTrades.map((t) => ({
      id: `closed-${t.id}`,
      code: t.code,
      name: t.name,
      accountName: t.accountName,
      entryDate: t.entryDate,
      quantity: t.quantity,
      entryPrice: t.entryPrice,
      entryTotal: t.entryPrice * t.quantity,
      currentPrice: null,
      exitPrice: t.exitPrice,
      closeDate: t.exitDate,
      exitTotal: t.exitPrice * t.quantity,
      realizedPL: (t.exitPrice - t.entryPrice) * t.quantity,
      valuationTotal: null,
      valuationPL: null,
      holdingPeriod: Math.floor(
        (new Date(t.exitDate).getTime() - new Date(t.entryDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }));

    return [...openPositions, ...closed].sort((a, b) => {
      return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
    });
  }, [positions, closedTrades]);

  const filtered = useMemo(() => {
    return allTrades.filter((p) => {
      // テキスト検索
      const matchesText =
        p.name.includes(filterText) || p.code.includes(filterText);
      if (!matchesText) return false;

      // 期間指定 (Entry日)
      if (startDate && p.entryDate < startDate) return false;
      if (endDate && p.entryDate > endDate) return false;

      // 表示対象（所持・売却済）
      const isOpen = p.id.startsWith("open-");
      if (isOpen && !showOpenPositions) return false;
      if (!isOpen && !showClosedTrades) return false;

      return true;
    });
  }, [
    allTrades,
    filterText,
    startDate,
    endDate,
    showOpenPositions,
    showClosedTrades,
  ]);

  if (filtered.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        該当する取引はありません。
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
          <TableHead className="p-2 font-medium text-slate-600 text-right whitespace-nowrap">
            取得株数
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right whitespace-nowrap">
            取得単価
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right whitespace-nowrap">
            取得金額
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600">
            売却日
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right whitespace-nowrap">
            保有期間
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right whitespace-nowrap">
            売却株数
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right whitespace-nowrap">
            売却単価
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right whitespace-nowrap">
            売却金額
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right w-px whitespace-nowrap">
            確定損益
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right whitespace-nowrap">
            保有期間
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right whitespace-nowrap">
            保有株数
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right whitespace-nowrap">
            現在値
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right whitespace-nowrap">
            評価額
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right w-px whitespace-nowrap">
            評価損益
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((item) => {
          const isRealizedPositive = (item.realizedPL ?? 0) >= 0;
          const isValuationPositive = (item.valuationPL ?? 0) >= 0;

          return (
            <TableRow
              key={item.id}
              className="hover:bg-slate-50 transition-colors"
            >
              <TableCell className="p-2">
                <div>
                  <div className="font-bold text-slate-800 ">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.code}</div>
                </div>
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
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                ¥{item.entryPrice.toLocaleString()}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                ¥{item.entryTotal.toLocaleString()}
              </TableCell>
              <TableCell className="p-2 text-slate-600">
                {item.closeDate || "-"}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                {item.closeDate && item.holdingPeriod !== null
                  ? `${item.holdingPeriod}日`
                  : "-"}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                {item.realizedPL !== null
                  ? item.quantity.toLocaleString()
                  : "-"}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                {item.exitPrice ? `¥${item.exitPrice.toLocaleString()}` : "-"}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                {item.exitTotal ? `¥${item.exitTotal.toLocaleString()}` : "-"}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap">
                {item.realizedPL !== null ? (
                  <span
                    className={`font-bold ${
                      isRealizedPositive ? "text-blue-600" : "text-red-600"
                    }`}
                  >
                    {isRealizedPositive ? "+" : ""}
                    {item.realizedPL.toLocaleString()}
                  </span>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                {!item.closeDate && item.holdingPeriod !== null
                  ? `${item.holdingPeriod}日`
                  : "-"}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                {item.valuationPL !== null
                  ? item.quantity.toLocaleString()
                  : "-"}
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
