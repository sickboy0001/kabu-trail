import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

export type AccountTransaction = {
  id: string | number;
  transactionDate: string;
  amount: number;
  type: string;
  description?: string;
  bucketId: string;
  [key: string]: any;
};

export const useTransactionData = (userId: string | undefined) => {
  const [transactions, setTransactions] = useState<AccountTransaction[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from("account_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("transaction_date", { ascending: true });

      if (error) {
        console.error("Error fetching transactions:", error);
        return;
      }

      if (data) {
        const formatted: AccountTransaction[] = data.map((t) => ({
          ...t,
          id: t.id,
          transactionDate: t.transaction_date,
          amount: t.amount,
          type: t.type || t.transaction_type,
          description: t.description || t.memo,
          bucketId: t.bucket_id || t.account_id,
        }));
        setTransactions(formatted);
      }
    };

    fetchTransactions();
  }, [userId, supabase]);

  return { transactions };
};
