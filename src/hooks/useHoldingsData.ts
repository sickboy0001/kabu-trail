// d:\work\dev\spa\kabu-trail\src\hooks\useHoldingsData.ts
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  fetchTransactions,
  type TransactionWithDetails,
} from "@/services/transactions";
import { fetchMultipleStockDetails } from "@/lib/stockApi";
import { fetchBrokerAccounts, type BrokerAccount } from "@/services/account";

export type Position = {
  id: string;
  code: string;
  name: string;
  bucketId: string;
  accountName: string;
  quantity: number;
  entryDate: string;
  entryPrice: number;
  currentPrice: number;
  previousClose?: number;
  valuationPL?: number;
  entryType?: string;
};

export type ClosedTrade = {
  id: string;
  code: string;
  name: string;
  bucketId?: string;
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

export const useHoldingsData = (userId: string | undefined) => {
  const [transactions, setTransactions] = useState<TransactionWithDetails[]>(
    [],
  );
  const [accounts, setAccounts] = useState<BrokerAccount[]>([]);
  const [prices, setPrices] = useState<
    Record<string, { current: number; previous?: number }>
  >({});

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const [txData, accData] = await Promise.all([
        fetchTransactions(userId),
        fetchBrokerAccounts(userId),
      ]);
      setTransactions(txData);
      setAccounts(accData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Process transactions to build positions and history
  const { positions: basePositions, closedTrades } = useMemo(() => {
    const accountMap = new Map(accounts.map((a) => [a.id, a]));

    const sorted = [...transactions].sort(
      (a, b) =>
        new Date(a.transaction_date).getTime() -
        new Date(b.transaction_date).getTime(),
    );

    type Lot = {
      date: string;
      price: number;
      quantity: number;
      bucketId: string;
      accountName: string;
      stockName: string;
      type: "LONG" | "SHORT";
      entryType: string;
    };

    const openLots: Record<string, Lot[]> = {};
    const closed: ClosedTrade[] = [];
    const current: Position[] = [];

    sorted.forEach((t) => {
      // タグ付き口座の取引は除外
      const account = accountMap.get(t.account_id);
      if (account?.category && account.category.length > 0) return;

      // 証券コードがない取引（入出金、源泉徴収など）はポジション管理の対象外
      if (!t.stock_code) return;

      if (
        ![
          "BUY",
          "SELL",
          "CREDIT_OPEN",
          "CREDIT_CLOSE",
          "STOCK_SPLIT",
          "STOCK_MERGE",
          "STOCK_TRANSFER_IN",
          "STOCK_TRANSFER_OUT",
        ].includes(t.transaction_type as string)
      ) {
        return;
      }

      const key = `${t.account_id}-${t.stock_code}`;
      if (!openLots[key]) openLots[key] = [];

      const isMerge = (t.transaction_type as string) === "STOCK_MERGE";
      const isSplit = (t.transaction_type as string) === "STOCK_SPLIT";

      const isLongEntry =
        t.transaction_type === "BUY" ||
        (t.transaction_type as string) === "STOCK_TRANSFER_IN";
      const isShortEntry = t.transaction_type === "CREDIT_OPEN"; // Assuming CREDIT_OPEN is Short Sell
      const isLongExit =
        t.transaction_type === "SELL" ||
        (t.transaction_type as string) === "STOCK_TRANSFER_OUT";
      const isShortExit = t.transaction_type === "CREDIT_CLOSE"; // Assuming CREDIT_CLOSE is Buy to Cover

      if (isMerge) {
        // 株式併合: 保有数量を減らし、取得単価を上げて、取得総額（簿価）を維持する
        const lots = openLots[key];
        const reductionQty = t.quantity || 0; // 減少する数量（例: 100株->1株なら99株）
        const totalQty = lots.reduce((sum, l) => sum + l.quantity, 0);

        if (totalQty > 0 && reductionQty > 0) {
          const remainingQty = totalQty - reductionQty;
          if (remainingQty > 0) {
            const ratio = remainingQty / totalQty; // 残存率 (例: 1/100 = 0.01)
            lots.forEach((lot) => {
              // 数量は減る、単価は増える
              lot.quantity = lot.quantity * ratio;
              lot.price = lot.price / ratio;
            });
          } else {
            // 全て消滅する場合（通常ありえないが、端数処理等で0になる場合）
            openLots[key] = [];
          }
        }

        // 履歴として記録（損益は発生しないものとする）
        closed.push({
          id: `${t.id}-merge`,
          code: t.stock_code || "",
          name: t.stock_name || (lots[0]?.stockName ?? ""),
          bucketId: String(t.account_id),
          accountName: t.account_name || (lots[0]?.accountName ?? ""),
          quantity: reductionQty,
          entryDate: t.transaction_date,
          entryPrice: 0,
          exitDate: t.transaction_date,
          exitPrice: 0,
          realizedPL: 0,
          exitType: t.transaction_type,
          entryType: "MERGE",
        });
      } else if (isSplit) {
        // 株式分割: 保有数量を増やし、取得単価を下げて、取得総額（簿価）を維持する
        const lots = openLots[key];
        const increaseQty = t.quantity || 0; // 増加する数量（例: 100株->200株なら+100株）
        const totalQty = lots.reduce((sum, l) => sum + l.quantity, 0);

        if (totalQty > 0 && increaseQty > 0) {
          const newTotalQty = totalQty + increaseQty;
          const ratio = newTotalQty / totalQty; // 増加率 (例: 200/100 = 2倍)

          lots.forEach((lot) => {
            // 数量は増える、単価は減る
            lot.quantity = lot.quantity * ratio;
            lot.price = lot.price / ratio;
          });
        }

        // 履歴として記録（損益は発生しないものとする）
        closed.push({
          id: `${t.id}-split`,
          code: t.stock_code || "",
          name: t.stock_name || (lots[0]?.stockName ?? ""),
          bucketId: String(t.account_id),
          accountName: t.account_name || (lots[0]?.accountName ?? ""),
          quantity: increaseQty,
          entryDate: t.transaction_date,
          entryPrice: 0,
          exitDate: t.transaction_date,
          exitPrice: 0,
          realizedPL: 0,
          exitType: t.transaction_type,
          entryType: "SPLIT",
        });
      } else if (isLongEntry || isShortEntry) {
        openLots[key].push({
          date: t.transaction_date,
          price: t.unit_price || 0,
          quantity: t.quantity || 0,
          bucketId: String(t.account_id),
          accountName: t.account_name || "",
          stockName: t.stock_name || "",
          type: isLongEntry ? "LONG" : "SHORT",
          entryType: t.transaction_type,
        });
      } else if (isLongExit || isShortExit) {
        let remainingQty = t.quantity || 0;
        const targetType = isLongExit ? "LONG" : "SHORT";

        // Consume lots FIFO
        while (remainingQty > 0) {
          // Find first matching lot
          const lotIndex = openLots[key].findIndex(
            (l) => l.type === targetType,
          );
          if (lotIndex === -1) break; // No matching open position found

          const lot = openLots[key][lotIndex];
          const consume = Math.min(remainingQty, lot.quantity);
          const exitPrice = t.unit_price || 0;

          // Calculate PL
          // Long: (Exit - Entry) * Qty
          // Short: (Entry - Exit) * Qty
          const plPerShare =
            lot.type === "LONG" ? exitPrice - lot.price : lot.price - exitPrice;

          // 出庫・併合の場合は損益を計上しない（0とする）か、
          // 必要に応じて計算ロジックを変える。ここでは0として扱う。
          const realizedPL = ["STOCK_TRANSFER_OUT"].includes(
            t.transaction_type as string,
          )
            ? 0
            : plPerShare * consume;

          closed.push({
            id: `${t.id}-${lot.date}-${remainingQty}`,
            code: t.stock_code || "",
            name: t.stock_name || lot.stockName,
            bucketId: lot.bucketId,
            accountName: t.account_name || lot.accountName,
            quantity: consume,
            entryDate: lot.date,
            entryPrice: lot.price,
            exitDate: t.transaction_date,
            exitPrice: exitPrice,
            realizedPL: realizedPL,
            exitType: t.transaction_type,
            entryType: lot.entryType,
          });

          lot.quantity -= consume;
          remainingQty -= consume;

          if (lot.quantity <= 0) {
            openLots[key].splice(lotIndex, 1);
          }
        }
      }
    });

    // Convert remaining lots to Positions
    Object.entries(openLots).forEach(([key, lots]) => {
      const [, code] = key.split("-");

      // Group by type (LONG/SHORT) to merge lots
      const groups: Record<
        string,
        {
          quantity: number;
          totalCost: number;
          minDate: string;
          entryType: string;
          stockName: string;
          accountName: string;
          bucketId: string;
        }
      > = {};

      lots.forEach((lot) => {
        if (lot.quantity <= 0) return;

        if (!groups[lot.type]) {
          groups[lot.type] = {
            quantity: 0,
            totalCost: 0,
            minDate: lot.date,
            entryType: lot.entryType,
            stockName: lot.stockName,
            accountName: lot.accountName,
            bucketId: lot.bucketId,
          };
        }

        const g = groups[lot.type];
        g.quantity += lot.quantity;
        g.totalCost += lot.price * lot.quantity;
        if (new Date(lot.date) < new Date(g.minDate)) {
          g.minDate = lot.date;
        }
        if (!g.stockName) g.stockName = lot.stockName;
        if (!g.accountName) g.accountName = lot.accountName;
        if (!g.bucketId) g.bucketId = lot.bucketId;
      });

      Object.entries(groups).forEach(([type, g]) => {
        const avgPrice = g.totalCost / g.quantity;
        // Placeholder for current price (using entry price as we don't have live data)
        const currentPrice = avgPrice;
        const plPerShare =
          type === "LONG" ? currentPrice - avgPrice : avgPrice - currentPrice;

        current.push({
          id: `pos-${key}-${type}`,
          code: code,
          name: g.stockName,
          bucketId: g.bucketId,
          accountName: g.accountName,
          quantity: g.quantity,
          entryDate: g.minDate,
          entryPrice: avgPrice,
          currentPrice: currentPrice,
          valuationPL: plPerShare * g.quantity,
          entryType: g.entryType,
        });
      });
    });

    return { positions: current, closedTrades: closed };
  }, [transactions]);

  // Fetch current prices for open positions
  useEffect(() => {
    if (basePositions.length === 0) return;

    const codes = Array.from(new Set(basePositions.map((p) => p.code)));
    const loadPrices = async () => {
      try {
        const details = await fetchMultipleStockDetails(codes);
        const newPrices: Record<
          string,
          { current: number; previous?: number }
        > = {};
        Object.entries(details).forEach(([code, d]) => {
          if (d && d.current_price != null) {
            // デバッグ用: 最初の1件のデータ構造をログ出力（APIレスポンス確認用）
            if (Object.keys(newPrices).length === 0) {
              console.log(
                `[useHoldingsData] API Response Sample for ${code}:`,
                d,
              );
            }
            newPrices[code] = {
              current: d.current_price,
              // プロパティ名の揺らぎに対応 (snake_case, camelCase, PascalCase)
              previous:
                (d as any).prev_close ??
                (d as any).previousClose ??
                (d as any).PreviousClose ??
                undefined,
            };
          }
        });
        setPrices(newPrices);
      } catch (error) {
        console.error("Failed to fetch stock prices", error);
      }
    };

    loadPrices();
  }, [basePositions]);

  const positions = useMemo(() => {
    return basePositions.map((p) => {
      const priceData = prices[p.code];
      const currentPrice = priceData?.current ?? p.entryPrice;
      const previousClose = priceData?.previous;
      const isShort = p.entryType === "CREDIT_OPEN";
      const plPerShare = isShort
        ? p.entryPrice - currentPrice
        : currentPrice - p.entryPrice;
      return {
        ...p,
        currentPrice,
        previousClose,
        valuationPL: plPerShare * p.quantity,
      };
    });
  }, [basePositions, prices]);

  return { positions, closedTrades, transactions, refresh };
};
