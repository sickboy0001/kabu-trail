import { useMemo, useState, Fragment } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type TransactionWithDetails } from "@/services/transactions";

// TradeHistoryClient等と共通の型定義ですが、依存関係を避けるためここで定義します
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

type Props = {
  filterText: string;
  trades: ClosedTrade[];
  startDate: string;
  endDate: string;
  transactions: TransactionWithDetails[];
};

export default function RoundTripTradeTable({
  filterText,
  trades,
  startDate,
  endDate,
  transactions,
}: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIds(next);
  };

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
        holdingPeriod: Math.floor(
          (new Date(t.exitDate).getTime() - new Date(t.entryDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      }))
      .sort((a, b) => {
        // 売却日の降順、次に銘柄コード順
        const exitDateDiff =
          new Date(b.exitDate).getTime() - new Date(a.exitDate).getTime();
        if (exitDateDiff !== 0) return exitDateDiff;
        return a.code.localeCompare(b.code);
      });
  }, [trades, filterText, startDate, endDate]);

  const getCycleHistory = (cycle: ClosedTrade) => {
    return transactions
      .filter(
        (t) =>
          t.stock_code === cycle.code &&
          t.account_name === cycle.accountName &&
          t.transaction_date >= cycle.entryDate &&
          t.transaction_date <= cycle.exitDate,
      )
      .sort(
        (a, b) =>
          new Date(a.transaction_date).getTime() -
          new Date(b.transaction_date).getTime(),
      );
  };

  const formatTransactionType = (type: string) => {
    const map: Record<string, string> = {
      BUY: "購入",
      SELL: "売却",
      STOCK_SPLIT: "分割",
      STOCK_MERGE: "併合",
      STOCK_TRANSFER_IN: "入庫",
      STOCK_TRANSFER_OUT: "出庫",
      CREDIT_OPEN: "信用新規",
      CREDIT_CLOSE: "信用返済",
    };
    return map[type] || type;
  };

  const getTradeTypeBadge = (type?: string) => {
    if (type === "CREDIT_OPEN") {
      return (
        <span className="ml-1 text-[10px] px-1 py-0.5 rounded border border-purple-200 bg-purple-50 text-purple-700 whitespace-nowrap">
          信用
        </span>
      );
    }
    if (type === "BUY") {
      return (
        <span className="ml-1 text-[10px] px-1 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 whitespace-nowrap">
          現物
        </span>
      );
    }
    return null;
  };

  if (filtered.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500">
        表示する取引はありません。
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="rounded-md border overflow-hidden">
        {/* 枠線用 */}
        <div className="overflow-x-auto w-full">
          <Table className="min-w-max">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-10 p-2"></TableHead>
                <TableHead className="p-2 font-medium text-slate-600 whitespace-nowrap">
                  銘柄
                </TableHead>
                <TableHead className="p-2 font-medium text-slate-600 whitespace-nowrap">
                  口座
                </TableHead>
                <TableHead className="p-2 font-medium text-slate-600 text-right whitespace-nowrap">
                  株数
                </TableHead>
                <TableHead className="p-2 font-medium text-slate-600 whitespace-nowrap">
                  取得日
                </TableHead>
                <TableHead className="p-2 font-medium text-slate-600 text-right whitespace-nowrap">
                  取得金額
                </TableHead>
                <TableHead className="p-2 font-medium text-slate-600 whitespace-nowrap">
                  売却日
                </TableHead>
                <TableHead className="p-2 font-medium text-slate-600 text-right whitespace-nowrap">
                  売却金額
                </TableHead>
                <TableHead className="p-2 font-medium text-slate-600 text-right whitespace-nowrap">
                  保有期間
                </TableHead>
                <TableHead className="p-2 font-medium text-slate-600 text-right whitespace-nowrap">
                  確定損益
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const isPositive = (item.realizedPL ?? 0) >= 0;
                const isNonTradeExit =
                  item.exitType === "STOCK_MERGE" ||
                  item.exitType === "STOCK_TRANSFER_OUT";
                const isExpanded = expandedIds.has(item.id);

                const totalEntryAmount = item.entryPrice * item.quantity;
                const plPercent =
                  totalEntryAmount !== 0 && item.realizedPL !== undefined
                    ? (item.realizedPL / totalEntryAmount) * 100
                    : 0;

                const periodForCalc = Math.max(1, item.holdingPeriod);
                const dailyPL =
                  item.realizedPL !== undefined
                    ? item.realizedPL / periodForCalc
                    : 0;

                return (
                  <Fragment key={item.id}>
                    <TableRow className="hover:bg-slate-50 transition-colors">
                      <TableCell className="p-2">
                        <button
                          onClick={() => toggleRow(item.id)}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500"
                        >
                          {isExpanded ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="p-2 whitespace-nowrap">
                        <Link
                          href={`/stock?code=${item.code}`}
                          className="block group"
                        >
                          <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {item.name}
                          </div>
                          <div className="text-xs text-slate-500 group-hover:text-blue-500 transition-colors">
                            {item.code}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="p-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="rounded text-xs font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5">
                            {item.accountName}
                          </span>
                          {getTradeTypeBadge(item.entryType)}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 text-right whitespace-nowrap font-mono">
                        {item.quantity.toLocaleString()}
                        {item.entryType === "STOCK_SPLIT" && (
                          <span className="text-xs text-teal-600 ml-1">
                            (分割)
                          </span>
                        )}
                        {item.entryType === "STOCK_TRANSFER_IN" && (
                          <span className="text-xs text-teal-600 ml-1">
                            (入庫)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="p-2 text-slate-600 whitespace-nowrap">
                        {item.entryDate}
                      </TableCell>
                      <TableCell className="p-2 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-mono">
                            ¥
                            {(item.entryPrice * item.quantity).toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">
                            (＠¥{item.entryPrice.toLocaleString()})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="p-2 text-slate-600 whitespace-nowrap">
                        {item.exitDate}
                      </TableCell>
                      <TableCell className="p-2 text-right whitespace-nowrap">
                        {isNonTradeExit ? (
                          <div className="flex flex-col items-end">
                            <span className="font-mono">-</span>
                            <span className="text-xs text-slate-500">
                              {item.exitType === "STOCK_MERGE"
                                ? "併合"
                                : "出庫"}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-end">
                            <span className="font-mono">
                              ¥
                              {(
                                item.exitPrice * item.quantity
                              ).toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              (＠¥{item.exitPrice.toLocaleString()})
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="p-2 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <span className="font-mono">
                            {item.holdingPeriod}日
                          </span>
                          {!isNonTradeExit ? (
                            <span
                              className={`text-xs font-mono ${
                                dailyPL >= 0 ? "text-blue-600" : "text-red-600"
                              }`}
                            >
                              ({dailyPL >= 0 ? "+" : ""}
                              {Math.round(dailyPL).toLocaleString()})
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="p-2 text-right whitespace-nowrap">
                        {!isNonTradeExit ? (
                          <div className="flex flex-col items-end">
                            <span
                              className={`font-bold ${
                                isPositive ? "text-blue-600" : "text-red-600"
                              }`}
                            >
                              {isPositive ? "+" : ""}
                              {item.realizedPL?.toLocaleString()}
                            </span>
                            <span
                              className={`text-xs ${isPositive ? "text-blue-600" : "text-red-600"}`}
                            >
                              ({plPercent > 0 ? "+" : ""}
                              {plPercent.toFixed(1)}%)
                            </span>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-slate-50/50">
                        <TableCell colSpan={10} className="p-4">
                          <div className="bg-white rounded border border-slate-200 p-3">
                            <h4 className="text-xs font-bold text-slate-500 mb-2">
                              取引履歴詳細 ({item.entryDate} 〜 {item.exitDate})
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow className="border-b border-slate-100">
                                  <TableHead className="h-8 text-xs">
                                    日付
                                  </TableHead>
                                  <TableHead className="h-8 text-xs">
                                    取引
                                  </TableHead>
                                  <TableHead className="h-8 text-xs text-right">
                                    数量
                                  </TableHead>
                                  <TableHead className="h-8 text-xs text-right">
                                    単価
                                  </TableHead>
                                  <TableHead className="h-8 text-xs text-right">
                                    受渡金額
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {getCycleHistory(item).map((hist) => (
                                  <TableRow
                                    key={hist.id}
                                    className="border-b border-slate-50 last:border-0"
                                  >
                                    <TableCell className="py-1 text-xs text-slate-600">
                                      {hist.transaction_date}
                                    </TableCell>
                                    <TableCell className="py-1 text-xs font-medium text-slate-700">
                                      {formatTransactionType(
                                        hist.transaction_type,
                                      )}
                                    </TableCell>
                                    <TableCell className="py-1 text-xs text-right font-mono">
                                      {hist.quantity?.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="py-1 text-xs text-right font-mono">
                                      {hist.unit_price
                                        ? `¥${hist.unit_price.toLocaleString()}`
                                        : "-"}
                                    </TableCell>
                                    <TableCell className="py-1 text-xs text-right font-mono">
                                      {hist.amount
                                        ? `¥${hist.amount.toLocaleString()}`
                                        : "-"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>{" "}
        </div>
      </div>

      <div className="p-4 text-xs text-slate-500 text-right">
        ※配当金は本一覧には含まれません。
      </div>
    </div>
  );
}
