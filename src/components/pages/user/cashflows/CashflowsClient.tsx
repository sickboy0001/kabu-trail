"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { User } from "@supabase/supabase-js";
import { History, Wallet, Search, TrendingUp } from "lucide-react";
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
import { fetchBrokerAccounts, type BrokerAccount } from "@/services/account";
import AccountFilter from "@/components/Organisms/AccountFilter";
import { CashflowHistoryList, typeLabels } from "./CashflowHistoryList";

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
          userId={user.id}
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
  userId,
  transactions,
  onEdit,
  onDelete,
}: {
  userId: string;
  transactions: TransactionWithDetails[];
  onEdit: (t: TransactionWithDetails) => void;
  onDelete: (t: TransactionWithDetails) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [brokerAccounts, setBrokerAccounts] = useState<BrokerAccount[]>([]);

  useEffect(() => {
    if (userId) {
      fetchBrokerAccounts(userId).then(setBrokerAccounts);
    }
  }, [userId]);

  const accounts = useMemo(() => {
    const uniqueAccounts = Array.from(
      new Set(
        transactions.map((t) => t.account_name).filter((n): n is string => !!n),
      ),
    );
    return uniqueAccounts.sort((a, b) => {
      // 口座名からIDを特定するためにトランザクションを参照
      const transA = transactions.find((t) => t.account_name === a);
      const transB = transactions.find((t) => t.account_name === b);

      // IDでブローカーアカウントを検索 (見つからない場合は名前でフォールバック)
      const accA =
        (transA &&
          brokerAccounts.find((acc) => acc.id === transA.account_id)) ||
        brokerAccounts.find((acc) => acc.name === a);
      const accB =
        (transB &&
          brokerAccounts.find((acc) => acc.id === transB.account_id)) ||
        brokerAccounts.find((acc) => acc.name === b);

      const orderA = Number((accA as any)?.sort_order ?? 9999);
      const orderB = Number((accB as any)?.sort_order ?? 9999);
      return orderA - orderB || a.localeCompare(b);
    });
  }, [transactions, brokerAccounts]);

  const filteredTransactions = transactions.filter((t) => {
    const searchLower = searchTerm.toLowerCase();
    const typeLabel = typeLabels[t.transaction_type as string] || "";
    if (
      selectedAccounts.length > 0 &&
      (!t.account_name || !selectedAccounts.includes(t.account_name))
    ) {
      return false;
    }
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
      <div className="flex flex-col lg:flex-row justify-between items-end gap-4 mb-6 border-b border-slate-200 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 whitespace-nowrap">
            <History className="text-slate-500" size={20} />
            履歴一覧
          </h2>
          <AccountFilter
            accounts={accounts}
            selectedAccounts={selectedAccounts}
            onChange={setSelectedAccounts}
          />
        </div>
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

      <CashflowHistoryList
        transactions={filteredTransactions}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
