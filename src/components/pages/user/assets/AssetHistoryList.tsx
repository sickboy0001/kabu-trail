import { ArrowUp, ArrowDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BrokerAccount } from "@/services/account";

type Props = {
  data: any[];
  brokerAccounts: BrokerAccount[];
};

export const formatTransactionType = (type: string) => {
  const key = type ? type.toUpperCase() : "";

  const map: Record<string, string> = {
    BUY: "購入",
    SELL: "売却",
    STOCK_SPLIT: "分割",
    STOCK_MERGE: "併合",
    STOCK_TRANSFER_IN: "入庫",
    STOCK_TRANSFER_OUT: "出庫",
    CREDIT_OPEN: "信用新規",
    CREDIT_CLOSE: "信用返済",
    DEPOSIT: "入金",
    WITHDRAWAL: "出金",
    DIVIDEND: "配当金・分配金",
    TAX: "源泉徴収",
    INTEREST: "利子",
    OTHER: "その他",
  };
  return map[key] || map[type] || type;
};

export function AssetHistoryList({ data, brokerAccounts }: Props) {
  return (
    <>
      {/* PC版: テーブル表示 */}
      <div className="hidden md:block rounded-md border bg-white shadow overflow-x-auto">
        <Table className="whitespace-nowrap">
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>口座</TableHead>
              <TableHead>日付</TableHead>
              <TableHead>取引区分</TableHead>
              <TableHead>銘柄コード</TableHead>
              <TableHead>摘要</TableHead>
              <TableHead className="text-right">手数料</TableHead>
              <TableHead className="text-right">税金</TableHead>
              <TableHead className="text-right">精算金額</TableHead>
              <TableHead className="text-right">残高 (合算)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => {
              const bucketId =
                item.bucketId || item.account_id || item.bucket_id;
              const account = brokerAccounts.find(
                (a) => String(a.id) === String(bucketId),
              );
              const accountName = account ? account.name : bucketId;
              const date = item.transactionDate || item.transaction_date;
              const type =
                item.type || item.transactionType || item.transaction_type;
              const code = item.stockCode || item.stock_code;
              const memo = item.memo || item.description;
              const quantity = item.quantity;
              const unitPrice = item.unitPrice || item.unit_price;
              const typeKey = type ? type.toUpperCase() : "";
              const isTrade = typeKey === "BUY" || typeKey === "SELL";
              const fee = item.fee || item.commission || 0;
              const tax = item.tax || 0;

              const current = item.calculatedBalance;
              const prev = index > 0 ? data[index - 1].calculatedBalance : null;
              let trend = null;
              if (current !== null && prev !== null) {
                if (current > prev) trend = "up";
                if (current < prev) trend = "down";
              }

              return (
                <TableRow key={item.id || index} className="hover:bg-slate-50">
                  <TableCell className="text-slate-600">
                    {accountName}
                  </TableCell>
                  <TableCell>{date}</TableCell>
                  <TableCell>{formatTransactionType(type)}</TableCell>
                  <TableCell>
                    {code ? (
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-slate-700">
                          {code}
                        </span>
                        <span className="text-xs text-slate-500 max-w-40 truncate">
                          {memo}
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-slate-500">-</span>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>{memo}</div>
                    {isTrade && quantity ? (
                      <div className="text-xs text-slate-500 mt-1">
                        {Number(quantity).toLocaleString()}株
                        {unitPrice
                          ? ` @ ${Number(unitPrice).toLocaleString()}円`
                          : ""}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-600">
                    {fee !== 0 ? Number(fee).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-600">
                    {tax !== 0 ? Number(tax).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono ${
                      item.amount > 0
                        ? "text-green-600"
                        : item.amount < 0
                          ? "text-red-600"
                          : ""
                    }`}
                  >
                    {item.amount > 0 ? "+" : ""}
                    {item.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <div className="flex items-center justify-end gap-1">
                      {trend === "up" && (
                        <ArrowUp size={14} className="text-green-600" />
                      )}
                      {trend === "down" && (
                        <ArrowDown size={14} className="text-red-600" />
                      )}
                      <span
                        className={
                          trend === "up"
                            ? "text-green-600"
                            : trend === "down"
                              ? "text-red-600"
                              : ""
                        }
                      >
                        {item.calculatedBalance.toLocaleString()}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* モバイル版: カードリスト表示 */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => {
          const bucketId = item.bucketId || item.account_id || item.bucket_id;
          const account = brokerAccounts.find(
            (a) => String(a.id) === String(bucketId),
          );
          const accountName = account ? account.name : bucketId;
          const date = item.transactionDate || item.transaction_date;
          const type =
            item.type || item.transactionType || item.transaction_type;
          const code = item.stockCode || item.stock_code;
          const memo = item.memo || item.description;
          const quantity = item.quantity;
          const unitPrice = item.unitPrice || item.unit_price;
          const typeKey = type ? type.toUpperCase() : "";
          const isTrade = typeKey === "BUY" || typeKey === "SELL";
          const fee = item.fee || item.commission || 0;
          const tax = item.tax || 0;

          const current = item.calculatedBalance;
          const prev = index > 0 ? data[index - 1].calculatedBalance : null;
          let trend = null;
          if (current !== null && prev !== null) {
            if (current > prev) trend = "up";
            if (current < prev) trend = "down";
          }

          return (
            <div
              key={item.id || index}
              className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-3"
            >
              {/* ヘッダー: 日付と口座 */}
              <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-100 pb-2">
                <span className="font-mono">{date}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  {accountName}
                </span>
              </div>

              {/* メイン情報: 取引区分、銘柄、摘要 */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {formatTransactionType(type)}
                  </span>
                  {code && (
                    <span className="font-mono font-bold text-slate-800">
                      {code}
                    </span>
                  )}
                </div>
                <div className="text-sm text-slate-600">{memo}</div>
                {isTrade && quantity && (
                  <div className="text-xs text-slate-500">
                    {Number(quantity).toLocaleString()}株
                    {unitPrice
                      ? ` @ ${Number(unitPrice).toLocaleString()}円`
                      : ""}
                  </div>
                )}
              </div>

              {/* 金額情報グリッド */}
              <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-2 rounded">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">手数料</span>
                  <span className="font-mono text-slate-600">
                    {fee !== 0 ? Number(fee).toLocaleString() : "-"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">税金</span>
                  <span className="font-mono text-slate-600">
                    {tax !== 0 ? Number(tax).toLocaleString() : "-"}
                  </span>
                </div>
                <div className="flex flex-col mt-1">
                  <span className="text-xs text-slate-400">精算金額</span>
                  <span
                    className={`font-mono font-bold ${
                      item.amount > 0
                        ? "text-green-600"
                        : item.amount < 0
                          ? "text-red-600"
                          : "text-slate-700"
                    }`}
                  >
                    {item.amount > 0 ? "+" : ""}
                    {item.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col mt-1">
                  <span className="text-xs text-slate-400">残高</span>
                  <div className="flex items-center gap-1 font-mono">
                    {trend === "up" && (
                      <ArrowUp size={14} className="text-green-600" />
                    )}
                    {trend === "down" && (
                      <ArrowDown size={14} className="text-red-600" />
                    )}
                    <span
                      className={
                        trend === "up"
                          ? "text-green-600"
                          : trend === "down"
                            ? "text-red-600"
                            : "text-slate-700"
                      }
                    >
                      {item.calculatedBalance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
