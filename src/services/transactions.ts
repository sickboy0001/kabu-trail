import { supabase } from "@/lib/supabase";
import { getStockNamesByCodes } from "./stocks";

export type TransactionType =
  | "BUY"
  | "SELL"
  | "CREDIT_OPEN"
  | "CREDIT_CLOSE"
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "DIVIDEND"
  | "INTEREST"
  | "OTHER";

export type TransactionInsert = {
  user_id: string;
  account_id: number;
  stock_code?: string | null;
  transaction_date: string;
  transaction_type: TransactionType;
  quantity?: number | null;
  unit_price?: number | null;
  fee?: number | null;
  amount: number;
  tax?: number | null;
  memo?: string | null;
};

export async function insertTransaction(data: TransactionInsert) {
  const { error } = await supabase.from("account_transactions").insert(data);
  if (error) throw error;
}

export async function updateTransaction(id: number, data: TransactionInsert) {
  const { error } = await supabase
    .from("account_transactions")
    .update(data)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTransaction(id: number) {
  const { error } = await supabase
    .from("account_transactions")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// フロントエンド表示用の拡張型定義
export type TransactionWithDetails = {
  id: number;
  user_id: string;
  account_id: number;
  transaction_date: string;
  transaction_type: TransactionType; // または string
  amount: number;
  memo: string | null;
  stock_code: string | null;
  quantity: number | null;
  unit_price: number | null;
  fee: number | null;
  tax: number | null;
  created_at: string;
  // Joinして取得するフィールド
  account_name: string;
  stock_name?: string | null;
};

/**
 * ユーザーの取引履歴を全件取得し、口座名と銘柄名を結合して返します。
 */
export const fetchTransactions = async (
  userId: string,
): Promise<TransactionWithDetails[]> => {
  // transactionsテーブルをベースに、broker_accountsとstocksを結合
  // ※ stocksテーブルとのリレーションが設定されていない場合は、stocks(name)の部分を削除してください
  const { data, error } = await supabase
    .from("account_transactions")
    .select(
      `
      *,
      broker_accounts (
        name
      )
    `,
    )
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }

  // 銘柄コードから銘柄名を取得
  const stockCodes = Array.from(
    new Set(
      data
        .map((t) => t.stock_code)
        .filter((c): c is string => typeof c === "string" && c.length > 0),
    ),
  );
  const stockNames = await getStockNamesByCodes(stockCodes);
  const stockNameMap = new Map(stockNames.map((s) => [s.code, s.name]));

  // 取得したデータをフラットな形に整形
  return data.map((t: any) => ({
    ...t,
    account_name: t.broker_accounts?.name ?? "不明な口座",
    stock_name: t.stock_code ? stockNameMap.get(t.stock_code) : null,
  }));
};
