"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { fetchBrokerAccounts, type BrokerAccount } from "@/services/account";
import { toast } from "sonner";
import StepUpload from "./StepUpload";
import StepPreview, { type ParsedTransaction } from "./StepPreview";
import StepComplete from "./StepComplete";
import {
  fetchTransactions,
  insertTransaction,
  deleteTransaction,
  type TransactionType,
} from "@/services/transactions";

type Props = {
  userId: string;
  accountId?: string;
};

export default function ImportTransactionsClient({
  userId,
  accountId: propAccountId,
}: Props) {
  const searchParams = useSearchParams();
  const initialAccountId = propAccountId || searchParams.get("accountId") || "";

  const [accounts, setAccounts] = useState<BrokerAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<"upload" | "preview" | "complete">("upload");

  // 口座一覧の取得
  useEffect(() => {
    const loadAccounts = async () => {
      if (!userId) return;
      try {
        const data = await fetchBrokerAccounts(userId);
        setAccounts(data);
        // 初期選択IDがあり、かつリストに含まれていればセット
        if (initialAccountId) {
          setSelectedAccountId(initialAccountId);
        }
      } catch (error) {
        console.error("Failed to fetch accounts", error);
        toast.error("口座情報の取得に失敗しました");
      }
    };
    loadAccounts();
  }, [userId, initialAccountId]);

  // 登録実行
  const handleImport = async (
    data: ParsedTransaction[],
    method: "overwrite" | "skip",
  ) => {
    if (!selectedAccountId) {
      toast.error("口座が選択されていません");
      return;
    }

    const toastId = toast.loading("データをインポート中...");

    try {
      // 1. データの整形とマッピング
      const formattedData = data
        .map((row) => {
          // 日付変換 (YYYY/MM/DD -> YYYY-MM-DD)
          const dateStr = row.date.replace(/\//g, "-");
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return null;
          const formattedDate = date.toISOString().split("T")[0];

          // 数値変換 (カンマ除去)
          const quantity = row.quantity
            ? Math.abs(Number(row.quantity.replace(/,/g, ""))) // 数量は常に正の値として扱う
            : 0;
          const unitPrice = row.unitPrice
            ? Number(row.unitPrice.replace(/,/g, ""))
            : 0;
          let amount = row.amount ? Number(row.amount.replace(/,/g, "")) : 0;
          const fee = row.fee ? Number(row.fee.replace(/,/g, "")) : 0;

          // NaNチェック（パースエラー防止）
          if (isNaN(amount)) amount = 0;

          // 取引区分マッピング
          let type: string = "OTHER";
          const typeStr = row.type || "";

          if (typeStr.includes("現物買")) type = "BUY";
          else if (typeStr.includes("現物売")) type = "SELL";
          else if (typeStr.includes("信用") && typeStr.includes("建"))
            type = "CREDIT_OPEN"; // 仮
          else if (
            typeStr.includes("信用") &&
            (typeStr.includes("埋") || typeStr.includes("返済"))
          )
            type = "CREDIT_CLOSE"; // 仮
          else if (typeStr.includes("分割")) type = "STOCK_SPLIT";
          else if (typeStr.includes("併合")) type = "STOCK_MERGE";
          else if (typeStr.includes("増減資") && typeStr.includes("入庫"))
            type = "STOCK_SPLIT";
          else if (typeStr.includes("増減資") && typeStr.includes("出庫"))
            type = "STOCK_MERGE";
          else if (typeStr.includes("入庫")) type = "STOCK_TRANSFER_IN";
          else if (typeStr.includes("出庫")) type = "STOCK_TRANSFER_OUT";
          else if (typeStr.includes("配当") || typeStr.includes("分配金"))
            type = "DIVIDEND";
          else if (typeStr.includes("入金")) type = "DEPOSIT";
          else if (typeStr.includes("出金")) type = "WITHDRAWAL";
          else if (typeStr.includes("源泉徴収") || typeStr.includes("税金"))
            type = "TAX";
          else if (typeStr.includes("利金") || typeStr.includes("利子"))
            type = "INTEREST";

          // 金額の正負調整
          if (type === "BUY" || type === "WITHDRAWAL" || type === "TAX") {
            amount = -Math.abs(amount);
          } else if (
            type === "SELL" ||
            type === "DEPOSIT" ||
            type === "DIVIDEND" ||
            type === "INTEREST"
          ) {
            amount = Math.abs(amount);
          }

          return {
            user_id: userId,
            account_id: Number(selectedAccountId),
            transaction_date: formattedDate,
            transaction_type: type as TransactionType,
            stock_code: row.code ? row.code.trim() : null,
            quantity: quantity || null,
            unit_price: unitPrice || null,
            amount: amount,
            fee: fee || null,
            tax: 0, // CSVから取得できれば設定
            memo: row.memo || row.name || "",
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (formattedData.length === 0) {
        toast.error("有効なデータがありませんでした", { id: toastId });
        return;
      }

      // 2. 既存データの取得（重複チェック・削除用）
      const existingTransactions = await fetchTransactions(userId);
      const targetAccountTransactions = existingTransactions.filter(
        (t) => t.account_id === Number(selectedAccountId),
      );

      // 3. インポート方法による分岐
      let transactionsToInsert = formattedData;

      if (method === "overwrite") {
        // 期間内のデータを削除
        const dates = formattedData.map((d) =>
          new Date(d.transaction_date).getTime(),
        );
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        const transactionsToDelete = targetAccountTransactions.filter((t) => {
          const tDate = new Date(t.transaction_date);
          return tDate >= minDate && tDate <= maxDate;
        });

        // 削除実行
        await Promise.all(
          transactionsToDelete.map((t) => deleteTransaction(t.id)),
        );
      } else {
        // 重複スキップ (Skip)
        transactionsToInsert = formattedData.filter((newT) => {
          // 同一日付、同一銘柄、同一金額、同一種別のデータがあれば重複とみなす
          const isDuplicate = targetAccountTransactions.some(
            (existT) =>
              existT.transaction_date === newT.transaction_date &&
              existT.stock_code === newT.stock_code &&
              existT.amount === newT.amount &&
              existT.transaction_type === newT.transaction_type,
          );
          return !isDuplicate;
        });
      }

      if (transactionsToInsert.length === 0) {
        toast.success("新規に追加するデータはありませんでした", {
          id: toastId,
        });
        setStep("complete");
        return;
      }

      // 4. データの登録
      // 現状一括登録APIがないため、ループで実行（件数が多い場合はAPI改善推奨）
      let successCount = 0;
      let skippedCount = 0;

      for (const t of transactionsToInsert) {
        try {
          await insertTransaction(t);
          successCount++;
        } catch (e: any) {
          // 409 Conflict (一意制約違反) の場合はスキップして続行
          if (
            e?.status === 409 ||
            e?.code === "23505" || // PostgreSQL unique_violation
            JSON.stringify(e).includes("409")
          ) {
            skippedCount++;
            console.warn("Skipped duplicate transaction:", t);
          }
          // 23503 Foreign Key Violation (銘柄コードがマスタにない) の場合
          else if (e?.code === "23503") {
            try {
              // stock_code を null にして、メモにコードを追記して再試行
              const retryT = {
                ...t,
                stock_code: null,
                memo: t.memo
                  ? `${t.memo} (上場廃止等 Code: ${t.stock_code})`
                  : `(上場廃止等 Code: ${t.stock_code})`,
              };
              await insertTransaction(retryT);
              successCount++;
            } catch (retryError) {
              console.error(
                "Retry failed for unknown stock code:",
                t,
                retryError,
              );
              throw retryError;
            }
          } else {
            // その他のエラーはスローして中断
            throw e;
          }
        }
      }

      const message =
        skippedCount > 0
          ? `${successCount}件インポートしました (${skippedCount}件スキップ)`
          : `${successCount}件のデータをインポートしました`;

      toast.success(message, { id: toastId });
      setStep("complete");
    } catch (error) {
      console.error("Import failed", error);
      toast.error("インポート中にエラーが発生しました", { id: toastId });
    }
  };

  const resetForm = () => {
    setFile(null);
    setStep("upload");
  };

  return (
    <div className="space-y-8">
      {/* ステップインジケーター */}
      <div className="flex items-center justify-center mb-8">
        <div
          className={`flex items-center ${step === "upload" ? "text-blue-600 font-bold" : "text-slate-500"}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step === "upload" ? "bg-blue-100 text-blue-600" : "bg-slate-100"}`}
          >
            1
          </div>
          アップロード
        </div>
        <div className="w-12 h-0.5 bg-slate-200 mx-4"></div>
        <div
          className={`flex items-center ${step === "preview" ? "text-blue-600 font-bold" : "text-slate-500"}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step === "preview" ? "bg-blue-100 text-blue-600" : "bg-slate-100"}`}
          >
            2
          </div>
          確認
        </div>
        <div className="w-12 h-0.5 bg-slate-200 mx-4"></div>
        <div
          className={`flex items-center ${step === "complete" ? "text-green-600 font-bold" : "text-slate-500"}`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${step === "complete" ? "bg-green-100 text-green-600" : "bg-slate-100"}`}
          >
            3
          </div>
          完了
        </div>
      </div>

      {step === "upload" && (
        <StepUpload
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onAccountChange={setSelectedAccountId}
          file={file}
          onFileChange={setFile}
          onNext={() => setStep("preview")}
          initialAccountId={initialAccountId}
        />
      )}

      {step === "preview" && (
        <StepPreview
          file={file}
          onBack={() => setStep("upload")}
          onImport={handleImport}
          account={accounts.find((a) => String(a.id) === selectedAccountId)}
        />
      )}

      {step === "complete" && <StepComplete onReset={resetForm} />}
    </div>
  );
}
