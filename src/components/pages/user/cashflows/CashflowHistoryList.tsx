import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, History } from "lucide-react";
import { TransactionWithDetails } from "@/services/transactions";

type Props = {
  transactions: TransactionWithDetails[];
  onEdit: (t: TransactionWithDetails) => void;
  onDelete: (t: TransactionWithDetails) => void;
};

export const typeLabels: Record<string, string> = {
  DEPOSIT: "入金",
  WITHDRAWAL: "出金",
  DIVIDEND: "配当金",
  TAX: "税金・源泉徴収",
  INTEREST: "利子",
  OTHER: "その他",
  BUY: "現物買",
  SELL: "現物売",
  CREDIT_OPEN: "信用建",
  CREDIT_CLOSE: "信用埋",
  STOCK_SPLIT: "株式分割",
  STOCK_MERGE: "株式併合",
  STOCK_TRANSFER_IN: "入庫",
  STOCK_TRANSFER_OUT: "出庫",
};

export const getTypeInfo = (type: string) => {
  if (type === "TAX") {
    return { label: "源泉徴収", className: "bg-orange-100 text-orange-800" };
  }
  if (type === "DIVIDEND") {
    return {
      label: typeLabels["DIVIDEND"],
      className: "bg-blue-100 text-blue-800",
    };
  }
  if (["STOCK_SPLIT", "STOCK_TRANSFER_IN"].includes(type)) {
    return {
      label: typeLabels[type] || type,
      className: "bg-teal-100 text-teal-800",
    };
  }
  if (["STOCK_MERGE", "STOCK_TRANSFER_OUT"].includes(type)) {
    return {
      label: typeLabels[type] || type,
      className: "bg-rose-100 text-rose-800",
    };
  }
  return {
    label: typeLabels[type] || type,
    className: "bg-slate-100 text-slate-600",
  };
};

export function CashflowHistoryList({ transactions, onEdit, onDelete }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 p-12 text-slate-500 border rounded-lg border-slate-200 bg-white">
        <History className="text-slate-300" size={48} />
        <p>履歴データはありません。</p>
      </div>
    );
  }

  return (
    <>
      {/* PC版: テーブル表示 */}
      <div className="hidden md:block overflow-x-auto border rounded-lg border-slate-200 bg-white">
        <Table className="whitespace-nowrap">
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-medium text-slate-600">日付</TableHead>
              <TableHead className="font-medium text-slate-600">
                口座/区分
              </TableHead>
              <TableHead className="font-medium text-slate-600">
                銘柄/摘要
              </TableHead>
              <TableHead className="font-medium text-slate-600 text-right">
                数量
              </TableHead>
              <TableHead className="font-medium text-slate-600 text-right">
                単価/金額
              </TableHead>
              <TableHead className="font-medium text-slate-600 text-right">
                手数料
              </TableHead>
              <TableHead className="font-medium text-slate-600 text-center">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((t) => {
              const { label, className } = getTypeInfo(
                t.transaction_type as string,
              );
              return (
                <TableRow
                  key={t.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <TableCell className="text-slate-600">
                    {t.transaction_date}
                  </TableCell>
                  <TableCell>
                    <div className="text-slate-800">{t.account_name}</div>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${className}`}
                    >
                      {label}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-800">
                      {t.stock_name || t.memo || "-"}
                    </div>
                    {t.stock_code && (
                      <div className="text-xs text-slate-500">
                        {t.stock_code}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {t.quantity ? `${t.quantity.toLocaleString()}株` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="text-slate-800 font-medium">
                      {t.amount.toLocaleString()}円
                    </div>
                    {t.unit_price && (
                      <div className="text-xs text-slate-500">
                        @{t.unit_price.toLocaleString()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">
                    {t.fee ? `${t.fee.toLocaleString()}円` : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(t)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                        title="編集"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(t)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* モバイル版: カードリスト表示 */}
      <div className="md:hidden space-y-4">
        {transactions.map((t) => {
          const { label, className } = getTypeInfo(
            t.transaction_type as string,
          );
          return (
            <div
              key={t.id}
              className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col gap-3"
            >
              <div className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-100 pb-2">
                <span className="font-mono">{t.transaction_date}</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                  {t.account_name}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${className}`}
                  >
                    {label}
                  </span>
                  {t.stock_code && (
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {t.stock_code}
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium text-slate-800">
                  {t.stock_name || t.memo || "-"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-2 rounded">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">数量</span>
                  <span className="font-mono text-slate-600">
                    {t.quantity ? `${t.quantity.toLocaleString()}株` : "-"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">単価</span>
                  <span className="font-mono text-slate-600">
                    {t.unit_price ? `@${t.unit_price.toLocaleString()}` : "-"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">手数料</span>
                  <span className="font-mono text-slate-600">
                    {t.fee ? `${t.fee.toLocaleString()}円` : "-"}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">金額</span>
                  <span className="font-mono font-bold text-slate-800">
                    {t.amount.toLocaleString()}円
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => onEdit(t)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded border border-slate-200 transition-colors"
                >
                  <Edit size={14} />
                  編集
                </button>
                <button
                  onClick={() => onDelete(t)}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 bg-slate-50 hover:bg-red-50 hover:text-red-600 rounded border border-slate-200 transition-colors"
                >
                  <Trash2 size={14} />
                  削除
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
