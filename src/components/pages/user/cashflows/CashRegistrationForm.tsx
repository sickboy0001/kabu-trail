"use client";

import { useEffect, useState } from "react";
import { fetchBrokerAccounts, type BrokerAccount } from "@/services/account";
import { NumericKeypad } from "@/components/Organisms/numeric-keypad";
import { DateSelect } from "@/components/Organisms/date-select";
import { toast } from "sonner";
import {
  insertTransaction,
  updateTransaction,
  type TransactionType,
  type TransactionWithDetails,
} from "@/services/transactions";

type Props = {
  userId: string;
  onSuccess?: () => void;
  initialData?: TransactionWithDetails | null;
};

export default function CashRegistrationForm({
  userId,
  onSuccess,
  initialData,
}: Props) {
  const [accounts, setAccounts] = useState<BrokerAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [activeInput, setActiveInput] = useState<"amount" | null>(null);
  const [cashType, setCashType] = useState("");
  const [memo, setMemo] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      const data = await fetchBrokerAccounts(userId);
      setAccounts(data);
      if (data.length > 0) {
        setSelectedAccountId(String(data[0].id));
      }
    };

    if (userId) fetchAccounts();
  }, [userId]);

  useEffect(() => {
    if (initialData) {
      setSelectedAccountId(String(initialData.account_id));
      setAmount(String(Math.abs(initialData.amount)));
      setMemo(initialData.memo || "");
      setDate(initialData.transaction_date);

      const typeMap: Record<string, string> = {
        DEPOSIT: "deposit",
        WITHDRAWAL: "withdrawal",
        DIVIDEND: "dividend",
        TAX: "tax",
        INTEREST: "interest",
        OTHER: "other",
      };
      if (typeMap[initialData.transaction_type]) {
        setCashType(typeMap[initialData.transaction_type]);
      }
    }
  }, [initialData]);

  const handleCashTypeChange = (type: string) => {
    setCashType(type);
    if (type === "tax" && !memo) {
      setMemo("源泉徴収");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccountId || !cashType || !amount) {
      toast.error("必須項目を入力してください");
      return;
    }

    const account = accounts.find((a) => String(a.id) === selectedAccountId);
    const typeMap: Record<string, string> = {
      deposit: "DEPOSIT",
      withdrawal: "WITHDRAWAL",
      dividend: "DIVIDEND",
      tax: "TAX",
      interest: "INTEREST",
      other: "OTHER",
    };
    const displayLabels: Record<string, string> = {
      deposit: "入金",
      withdrawal: "出金",
      dividend: "配当金・分配金",
      tax: "源泉徴収",
      interest: "利子",
      other: "その他",
    };

    const dbType = typeMap[cashType];
    const numericAmount = parseInt(amount, 10);

    // 出金の場合はマイナスとして記録する
    const finalAmount =
      dbType === "WITHDRAWAL" || dbType === "TAX"
        ? -Math.abs(numericAmount)
        : numericAmount;

    try {
      const payload = {
        user_id: userId,
        account_id: Number(selectedAccountId),
        transaction_date: date,
        transaction_type: dbType as TransactionType,
        amount: finalAmount,
        memo: memo || null,
        quantity: null,
        unit_price: null,
        fee: null,
        tax: null,
      };

      if (initialData) {
        await updateTransaction(initialData.id, payload);
        toast.success("更新しました", {
          description: `日付: ${date} / 口座: ${account?.name} / 種別: ${displayLabels[cashType]} / 金額: ${finalAmount}円`,
        });
      } else {
        await insertTransaction(payload);
        toast.success("登録しました", {
          description: `日付: ${date} / 口座: ${account?.name} / 種別: ${displayLabels[cashType]} / 金額: ${finalAmount}円`,
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error("登録に失敗しました");
    }
  };

  return (
    <div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              対象口座
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {accounts.length === 0 && (
                <option value="">選択してください</option>
              )}
              {accounts.map((account) => {
                const info = [(account as any).brokerName, account.category]
                  .filter(Boolean)
                  .join(" ");
                return (
                  <option key={account.id} value={account.id}>
                    {account.name}
                    {info ? ` (${info})` : ""}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              日付
            </label>
            <DateSelect value={date} onChange={setDate} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            種別
          </label>
          <div className="flex flex-wrap gap-4 mt-1">
            <label
              className={`flex items-center gap-2 cursor-pointer p-2 border rounded transition-colors ${
                cashType === "deposit"
                  ? "bg-green-50 border-green-500 ring-1 ring-green-500"
                  : "hover:bg-slate-50 border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="cashType"
                checked={cashType === "deposit"}
                onChange={() => handleCashTypeChange("deposit")}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-slate-700">入金</span>
            </label>
            <label
              className={`flex items-center gap-2 cursor-pointer p-2 border rounded transition-colors ${
                cashType === "withdrawal"
                  ? "bg-red-50 border-red-500 ring-1 ring-red-500"
                  : "hover:bg-slate-50 border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="cashType"
                checked={cashType === "withdrawal"}
                onChange={() => handleCashTypeChange("withdrawal")}
                className="text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-slate-700">出金</span>
            </label>
            <label
              className={`flex items-center gap-2 cursor-pointer p-2 border rounded transition-colors ${
                cashType === "dividend"
                  ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500"
                  : "hover:bg-slate-50 border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="cashType"
                checked={cashType === "dividend"}
                onChange={() => handleCashTypeChange("dividend")}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">配当金・分配金</span>
            </label>
            <label
              className={`flex items-center gap-2 cursor-pointer p-2 border rounded transition-colors ${
                cashType === "tax"
                  ? "bg-orange-50 border-orange-500 ring-1 ring-orange-500"
                  : "hover:bg-slate-50 border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="cashType"
                checked={cashType === "tax"}
                onChange={() => handleCashTypeChange("tax")}
                className="text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm text-slate-700">源泉徴収</span>
            </label>
            <label
              className={`flex items-center gap-2 cursor-pointer p-2 border rounded transition-colors ${
                cashType === "interest"
                  ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500"
                  : "hover:bg-slate-50 border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="cashType"
                checked={cashType === "interest"}
                onChange={() => handleCashTypeChange("interest")}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">利子</span>
            </label>
            <label
              className={`flex items-center gap-2 cursor-pointer p-2 border rounded transition-colors ${
                cashType === "other"
                  ? "bg-slate-100 border-slate-500 ring-1 ring-slate-500"
                  : "hover:bg-slate-50 border-slate-300"
              }`}
            >
              <input
                type="radio"
                name="cashType"
                checked={cashType === "other"}
                onChange={() => handleCashTypeChange("other")}
                className="text-slate-600 focus:ring-slate-500"
              />
              <span className="text-sm text-slate-700">その他（利子など）</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              金額 (円)
            </label>
            <input
              type="number"
              value={amount}
              readOnly
              onClick={() => setActiveInput("amount")}
              placeholder="10000"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer bg-white"
            />
            {cashType === "tax" && (
              <p className="text-xs text-orange-600 mt-1">
                ※マイナスで記録されます
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              摘要 / メモ
            </label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="例: 12月分給与振替"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-colors w-full md:w-auto"
          >
            {initialData ? "更新する" : "記録する"}
          </button>
        </div>
      </form>

      {activeInput === "amount" && (
        <NumericKeypad
          title="金額を入力"
          initialValue={amount}
          onConfirm={(val) => {
            setAmount(val);
            setActiveInput(null);
          }}
          onClose={() => setActiveInput(null)}
        />
      )}
    </div>
  );
}
