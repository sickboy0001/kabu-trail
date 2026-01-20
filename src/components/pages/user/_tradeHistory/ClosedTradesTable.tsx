import { useMemo } from "react";
import Link from "next/link";
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
  trades: ClosedTrade[];
  startDate: string;
  endDate: string;
};

export type ClosedTrade = {
  id: string;
  code: string;
  name: string;
  accountName: string;
  quantity: number;
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  realizedPL?: number;
  exitType?: string;
  entryType?: string;
};

export default function ClosedTradesTable({
  filterText,
  trades,
  startDate,
  endDate,
}: Props) {
  const filtered = useMemo(() => {
    return trades
      .filter((t) => {
        if (!t.code) return false;
        const matchesText =
          t.name.includes(filterText) || t.code.includes(filterText);
        if (!matchesText) return false;
        if (startDate && t.entryDate < startDate) return false;
        if (endDate && t.entryDate > endDate) return false;
        return true;
      })
      .map((t) => ({
        ...t,
        entryTotal: t.entryPrice * t.quantity,
        exitTotal: t.exitPrice * t.quantity,
        holdingPeriod: Math.floor(
          (new Date(t.exitDate).getTime() - new Date(t.entryDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      }))
      .sort((a, b) => {
        const codeDiff = a.code.localeCompare(b.code);
        if (codeDiff !== 0) return codeDiff;
        const exitDateDiff =
          new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime();
        if (exitDateDiff !== 0) return exitDateDiff;
        return (
          new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
        );
      });
  }, [trades, filterText, startDate, endDate]);

  const totalsByCode = useMemo(() => {
    const totals: Record<string, { realizedPL: number }> = {};
    filtered.forEach((item) => {
      if (!totals[item.code]) {
        totals[item.code] = { realizedPL: 0 };
      }
      if (item.realizedPL != null) {
        totals[item.code].realizedPL += item.realizedPL;
      }
    });
    return totals;
  }, [filtered]);

  // 売却グループごとの集計（同一コード、口座、売却日、売却タイプ）
  const groupTotals = useMemo(() => {
    const totals: Record<
      string,
      { quantity: number; exitTotal: number; realizedPL: number }
    > = {};
    filtered.forEach((t) => {
      const key = `${t.code}-${t.accountName}-${t.exitDate}-${t.exitType}`;
      if (!totals[key]) {
        totals[key] = { quantity: 0, exitTotal: 0, realizedPL: 0 };
      }
      totals[key].quantity += t.quantity;
      totals[key].exitTotal += t.exitTotal;
      totals[key].realizedPL += t.realizedPL ?? 0;
    });
    return totals;
  }, [filtered]);

  if (filtered.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        売却済みの取引はありません。
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
          <TableHead className="p-2 font-medium text-slate-600">
            売却日
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right">
            保有期間
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right">
            売却株数
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right">
            売却単価
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right">
            売却金額
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right">
            確定損益
          </TableHead>
          <TableHead className="p-2 font-medium text-slate-600 text-right">
            損益合計
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filtered.map((item, index) => {
          const isNonTradeExit =
            item.exitType === "STOCK_MERGE" ||
            item.exitType === "STOCK_TRANSFER_OUT";

          const totalInfo = totalsByCode[item.code];
          const isTotalPositive = totalInfo && totalInfo.realizedPL >= 0;

          const isLastForCode =
            index === filtered.length - 1 ||
            filtered[index + 1].code !== item.code;

          // 売却グループごとの最後の行判定（売却情報集約用）
          const currentGroupKey = `${item.code}-${item.accountName}-${item.exitDate}-${item.exitType}`;
          const nextItem = filtered[index + 1];
          const nextGroupKey = nextItem
            ? `${nextItem.code}-${nextItem.accountName}-${nextItem.exitDate}-${nextItem.exitType}`
            : "";
          const isLastInGroup = currentGroupKey !== nextGroupKey;

          const groupTotal = groupTotals[currentGroupKey];
          const isRealizedPositive = groupTotal.realizedPL >= 0;

          // 売却単価（平均）
          const avgExitPrice =
            groupTotal.quantity > 0
              ? groupTotal.exitTotal / groupTotal.quantity
              : 0;

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

              {/* 売却情報はグループの最後の行のみ表示 */}
              <TableCell className="p-2 text-slate-600">
                {isLastInGroup ? item.exitDate : ""}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                {item.holdingPeriod}日
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                {isLastInGroup
                  ? isNonTradeExit
                    ? "-"
                    : groupTotal.quantity.toLocaleString()
                  : ""}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                {isLastInGroup
                  ? isNonTradeExit
                    ? item.exitType === "STOCK_MERGE"
                      ? "併合"
                      : "出庫"
                    : `¥${Math.round(avgExitPrice).toLocaleString()}`
                  : ""}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap">
                {isLastInGroup
                  ? !isNonTradeExit
                    ? `¥${groupTotal.exitTotal.toLocaleString()}`
                    : "-"
                  : ""}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap">
                {isLastInGroup ? (
                  !isNonTradeExit ? (
                    <span
                      className={`font-bold ${
                        isRealizedPositive ? "text-blue-600" : "text-red-600"
                      }`}
                    >
                      {isRealizedPositive ? "+" : ""}
                      {groupTotal.realizedPL.toLocaleString()}
                    </span>
                  ) : (
                    "-"
                  )
                ) : (
                  ""
                )}
              </TableCell>
              <TableCell className="p-2 text-right whitespace-nowrap">
                {isLastForCode && (
                  <span
                    className={`font-bold ${
                      isTotalPositive ? "text-blue-600" : "text-red-600"
                    }`}
                  >
                    {isTotalPositive ? "+" : ""}
                    {totalInfo.realizedPL.toLocaleString()}
                  </span>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
