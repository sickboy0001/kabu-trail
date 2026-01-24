"use client";

import { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import {
  History,
  Wallet,
  Search,
  TrendingUp,
  Edit,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TradeRegistrationForm from "./TradeRegistrationForm";
import CashRegistrationForm from "./CashRegistrationForm";
import { Toaster, toast } from "sonner";
import {
  fetchTransactions,
  deleteTransaction,
  insertTransaction,
  type TransactionWithDetails,
} from "@/services/transactions";

type Props = {
  user: User;
};

export default function CashflowsClient({ user }: Props) {
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>(
    [],
  );
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionWithDetails | null>(null);

  const loadTransactions = useCallback(async () => {
    if (!user.id) return;
    try {
      const data = await fetchTransactions(user.id);
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions", error);
    }
  }, [user.id]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleEdit = (transaction: TransactionWithDetails) => {
    setEditingTransaction(transaction);
    const tradeTypes = ["BUY", "SELL", "CREDIT_OPEN", "CREDIT_CLOSE"];
    const corporateActionTypes = [
      "STOCK_SPLIT",
      "STOCK_MERGE",
      "STOCK_TRANSFER_IN",
      "STOCK_TRANSFER_OUT",
    ];
    if (
      tradeTypes.includes(transaction.transaction_type as string) ||
      corporateActionTypes.includes(transaction.transaction_type as string) ||
      // Legacy support: if stock_code exists for DEPOSIT/WITHDRAWAL
      (transaction.stock_code &&
        ["DEPOSIT", "WITHDRAWAL"].includes(
          transaction.transaction_type as string,
        ))
    ) {
      setIsTradeModalOpen(true);
    } else {
      setIsCashModalOpen(true);
    }
  };

  const handleDelete = async (transaction: TransactionWithDetails) => {
    try {
      await deleteTransaction(transaction.id);
      toast.success("削除しました", {
        action: {
          label: "元に戻す",
          onClick: async () => {
            try {
              // 元に戻す（再挿入）
              await insertTransaction({
                user_id: transaction.user_id,
                account_id: transaction.account_id,
                stock_code: transaction.stock_code,
                transaction_date: transaction.transaction_date,
                transaction_type: transaction.transaction_type,
                quantity: transaction.quantity,
                unit_price: transaction.unit_price,
                fee: transaction.fee,
                amount: transaction.amount,
                tax: transaction.tax,
                memo: transaction.memo,
              });
              toast.success("元に戻しました");
              loadTransactions();
            } catch (e) {
              console.error(e);
              toast.error("復元に失敗しました");
            }
          },
        },
      });
      loadTransactions();
    } catch (error) {
      console.error(error);
      toast.error("削除に失敗しました");
    }
  };

  return (
    <div className="space-y-6">
      <Toaster richColors position="top-center" />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            取引・入出金管理
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            日々の取引記録、配当金、入出金の管理を行います。
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsTradeModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <TrendingUp size={18} />
            株式取引登録
          </button>
          <button
            onClick={() => setIsCashModalOpen(true)}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Wallet size={18} />
            入出金・配当記録
          </button>
        </div>
      </div>

      {/* Main Content: History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <HistoryView
          transactions={transactions}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Modals */}
      <Dialog
        open={isTradeModalOpen}
        onOpenChange={(open) => {
          setIsTradeModalOpen(open);
          if (!open) setEditingTransaction(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="text-blue-500" size={20} />
              {editingTransaction ? "株式取引の編集" : "株式取引の登録"}
            </DialogTitle>
          </DialogHeader>
          <TradeRegistrationForm
            userId={user.id}
            onSuccess={() => {
              setIsTradeModalOpen(false);
              loadTransactions();
            }}
            initialData={editingTransaction}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCashModalOpen}
        onOpenChange={(open) => {
          setIsCashModalOpen(open);
          if (!open) setEditingTransaction(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="text-green-600" size={20} />
              {editingTransaction ? "入出金・配当の編集" : "入出金・配当の記録"}
            </DialogTitle>
          </DialogHeader>
          <CashRegistrationForm
            userId={user.id}
            onSuccess={() => {
              setIsCashModalOpen(false);
              loadTransactions();
            }}
            initialData={editingTransaction}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HistoryView({
  transactions,
  onEdit,
  onDelete,
}: {
  transactions: TransactionWithDetails[];
  onEdit: (t: TransactionWithDetails) => void;
  onDelete: (t: TransactionWithDetails) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const typeLabels: Record<string, string> = {
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

  const getTypeInfo = (t: TransactionWithDetails) => {
    if ((t.transaction_type as string) === "TAX") {
      return { label: "源泉徴収", className: "bg-orange-100 text-orange-800" };
    }
    if ((t.transaction_type as string) === "DIVIDEND") {
      return {
        label: typeLabels["DIVIDEND"],
        className: "bg-blue-100 text-blue-800",
      };
    }
    if (
      ["STOCK_SPLIT", "STOCK_TRANSFER_IN"].includes(
        t.transaction_type as string,
      )
    ) {
      return {
        label: typeLabels[t.transaction_type as string] || t.transaction_type,
        className: "bg-teal-100 text-teal-800",
      };
    }
    if (
      ["STOCK_MERGE", "STOCK_TRANSFER_OUT"].includes(
        t.transaction_type as string,
      )
    ) {
      return {
        label: typeLabels[t.transaction_type as string] || t.transaction_type,
        className: "bg-rose-100 text-rose-800",
      };
    }
    return {
      label: typeLabels[t.transaction_type as string] || t.transaction_type,
      className: "bg-slate-100 text-slate-600",
    };
  };

  const filteredTransactions = transactions.filter((t) => {
    const searchLower = searchTerm.toLowerCase();
    const typeLabel = typeLabels[t.transaction_type as string] || "";
    return (
      t.stock_name?.toLowerCase().includes(searchLower) ||
      t.stock_code?.toLowerCase().includes(searchLower) ||
      t.memo?.toLowerCase().includes(searchLower) ||
      t.account_name?.toLowerCase().includes(searchLower) ||
      typeLabel.includes(searchLower)
    );
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <History className="text-slate-500" size={20} />
          履歴一覧
        </h2>
        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            type="text"
            placeholder="検索..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg border-slate-200">
        <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 font-medium text-slate-600">日付</th>
              <th className="p-4 font-medium text-slate-600">口座/区分</th>
              <th className="p-4 font-medium text-slate-600">銘柄/摘要</th>
              <th className="p-4 font-medium text-slate-600 text-right">
                数量
              </th>
              <th className="p-4 font-medium text-slate-600 text-right">
                単価/金額
              </th>
              <th className="p-4 font-medium text-slate-600 text-right">
                手数料
              </th>
              <th className="p-4 font-medium text-slate-600 text-center">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <History className="text-slate-300" size={48} />
                    <p>履歴データはありません。</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 text-slate-600">{t.transaction_date}</td>
                  <td className="p-4">
                    <div className="text-slate-800">{t.account_name}</div>
                    {(() => {
                      const { label, className } = getTypeInfo(t);
                      return (
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${className}`}
                        >
                          {label}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">
                      {t.stock_name || t.memo || "-"}
                    </div>
                    {t.stock_code && (
                      <div className="text-xs text-slate-500">
                        {t.stock_code}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right text-slate-600">
                    {t.quantity ? `${t.quantity.toLocaleString()}株` : "-"}
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-slate-800 font-medium">
                      {t.amount.toLocaleString()}円
                    </div>
                    {t.unit_price && (
                      <div className="text-xs text-slate-500">
                        @{t.unit_price.toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-right text-slate-600">
                    {t.fee ? `${t.fee.toLocaleString()}円` : "-"}
                  </td>
                  <td className="p-4">
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
