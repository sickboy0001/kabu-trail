"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { Toaster, toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Trash2, Undo2 } from "lucide-react";
import {
  getBaskets,
  createBasket,
  updateBasket,
  deleteBasket,
  getBasketItems,
  addBasketItem,
  removeBasketItem,
  type StockBasket,
  type StockBasketItem,
} from "@/services/baskets";
import { getStockNamesByCodes, type StockInfo } from "@/services/stocks";
import { fetchMultipleStockDetails } from "@/lib/stockApi";
import { BasketModal } from "./BasketModal";
import { AddStockModal } from "./AddStockModal";
import { BasketDetail, type BasketItemWithInfo } from "./BasketDetail";
import { BasketList } from "./BasketList";

type Props = {
  user: User;
};

export default function BasketsClient({ user }: Props) {
  const [baskets, setBaskets] = useState<StockBasket[]>([]);
  const [selectedBasketId, setSelectedBasketId] = useState<number | null>(null);
  const [basketItems, setBasketItems] = useState<BasketItemWithInfo[]>([]);
  const [isLoadingBaskets, setIsLoadingBaskets] = useState(true);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Modals state
  const [isBasketModalOpen, setIsBasketModalOpen] = useState(false);
  const [editingBasket, setEditingBasket] = useState<StockBasket | null>(null);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);

  // 削除タイマー管理用
  const deleteTimers = useRef<{ [key: number]: NodeJS.Timeout }>({});
  const stockDeleteTimers = useRef<{ [key: number]: NodeJS.Timeout }>({});

  // Fetch baskets on mount
  useEffect(() => {
    fetchBaskets();
  }, [user.id]);

  // Fetch items when selected basket changes
  useEffect(() => {
    if (selectedBasketId) {
      fetchBasketItems(selectedBasketId);
    } else {
      setBasketItems([]);
    }
  }, [selectedBasketId]);

  const fetchBaskets = async () => {
    try {
      setIsLoadingBaskets(true);
      const data = await getBaskets(user.id);
      setBaskets(data);
      // Select the first basket by default if none selected
      if (data.length > 0 && !selectedBasketId) {
        setSelectedBasketId(data[0].id);
      }
    } catch (error) {
      console.error("Failed to fetch baskets:", error);
    } finally {
      setIsLoadingBaskets(false);
    }
  };

  const fetchBasketItems = async (basketId: number) => {
    try {
      setIsLoadingItems(true);
      const items = await getBasketItems(basketId);

      // Fetch stock names
      const codes = Array.from(new Set(items.map((i) => i.stock_code)));

      // 並列で名前と詳細情報を取得
      const [stockInfos, stockDetailsMap] = await Promise.all([
        getStockNamesByCodes(codes),
        fetchMultipleStockDetails(codes),
      ]);

      const stockMap = new Map(stockInfos.map((s) => [s.code, s.name]));

      const itemsWithInfo: BasketItemWithInfo[] = items.map((item) => {
        const d = stockDetailsMap[item.stock_code];
        const date = d ? new Date(d.updated_at) : new Date();
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

        return {
          ...item,
          name: stockMap.get(item.stock_code) || "Unknown",
          market: "東証", // APIレスポンスに含まれていないため固定
          currentPrice: d?.current_price ?? null,
          currentPriceDate: dateStr,
          priceChange:
            d?.current_price && d?.prev_close
              ? d.current_price - d.prev_close
              : null,
          priceChangePercent:
            d?.current_price && d?.prev_close
              ? ((d.current_price - d.prev_close) / d.prev_close) * 100
              : null,
          volume: d?.volume ?? null,
          prevClose: d?.prev_close ?? null,
          open: d?.open ?? null,
          low: d?.low ?? null,
          high: d?.high ?? null,
          tradingValue:
            d?.current_price && d?.volume ? d.current_price * d.volume : null, // 概算
        };
      });

      setBasketItems(itemsWithInfo);
    } catch (error) {
      console.error("Failed to fetch basket items:", error);
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleCreateBasket = async (name: string, description: string) => {
    try {
      const newBasket = await createBasket({
        user_id: user.id,
        name,
        description,
        sort_order: baskets.length, // 末尾に追加
      });
      setBaskets([newBasket, ...baskets]);
      setSelectedBasketId(newBasket.id);
    } catch (error) {
      console.error("Failed to create basket:", error);
      alert("バスケットの作成に失敗しました。");
    }
  };

  const handleUpdateBasket = async (name: string, description: string) => {
    if (!editingBasket) return;
    try {
      const updated = await updateBasket(editingBasket.id, {
        name,
        description,
      });
      setBaskets(baskets.map((b) => (b.id === updated.id ? updated : b)));
      setEditingBasket(null);
    } catch (error) {
      console.error("Failed to update basket:", error);
      alert("バスケットの更新に失敗しました。");
    }
  };

  const handleDeleteBasket = (id: number) => {
    const basketToDelete = baskets.find((b) => b.id === id);
    if (!basketToDelete) return;

    // UIから即座に削除（Optimistic UI）
    const newBaskets = baskets.filter((b) => b.id !== id);
    setBaskets(newBaskets);

    if (selectedBasketId === id) {
      setSelectedBasketId(newBaskets.length > 0 ? newBaskets[0].id : null);
    }

    // 実際の削除処理を遅延実行
    const timerId = setTimeout(async () => {
      try {
        await deleteBasket(id);
        delete deleteTimers.current[id];
      } catch (error) {
        console.error("Failed to delete basket:", error);
        toast.error("バスケットの削除に失敗しました");
        fetchBaskets(); // エラー時は再取得して状態を戻す
      }
    }, 4000);

    deleteTimers.current[id] = timerId;

    toast.custom(
      (t) => (
        <Alert className="bg-white w-full shadow-lg border-slate-200">
          <Trash2 className="h-4 w-4" />
          <AlertTitle>削除しました</AlertTitle>
          <AlertDescription className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-500">
              バスケットを削除しました
            </span>
            <button
              onClick={() => {
                if (deleteTimers.current[id]) {
                  clearTimeout(deleteTimers.current[id]);
                  delete deleteTimers.current[id];
                }
                setBaskets((prev) => {
                  const restored = [...prev, basketToDelete];
                  return restored.sort((a, b) => a.sort_order - b.sort_order);
                });
                setSelectedBasketId(id);
                toast.dismiss(t);
              }}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 ml-4"
            >
              <Undo2 size={14} />
              元に戻す
            </button>
          </AlertDescription>
        </Alert>
      ),
      { duration: 4000 },
    );
  };

  const handleMoveBasket = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === baskets.length - 1)
    ) {
      return;
    }

    const newBaskets = [...baskets];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    // 配列内で入れ替え
    [newBaskets[index], newBaskets[targetIndex]] = [
      newBaskets[targetIndex],
      newBaskets[index],
    ];

    setBaskets(newBaskets);

    try {
      // 変更された2つのアイテムのsort_orderを更新（念のため配列インデックスで上書き）
      await updateBasket(newBaskets[index].id, { sort_order: index });
      await updateBasket(newBaskets[targetIndex].id, {
        sort_order: targetIndex,
      });
    } catch (error) {
      console.error("Failed to reorder baskets:", error);
      // エラー時は再取得して元に戻す
      fetchBaskets();
    }
  };

  const handleAddStock = async (stock: StockInfo) => {
    if (!selectedBasketId) return;
    // Check for duplicates
    if (basketItems.some((item) => item.stock_code === stock.code)) {
      alert("この銘柄は既にバスケットに含まれています。");
      return;
    }
    try {
      await addBasketItem(selectedBasketId, stock.code);
      await fetchBasketItems(selectedBasketId);
    } catch (error) {
      console.error("Failed to add stock:", error);
      alert("銘柄の追加に失敗しました。");
    }
  };

  const handleRemoveStock = async (itemId: number) => {
    const originalIndex = basketItems.findIndex((item) => item.id === itemId);
    const itemToDelete = basketItems[originalIndex];
    if (!itemToDelete) return;

    // UIから即座に削除（Optimistic UI）
    setBasketItems((prev) => prev.filter((item) => item.id !== itemId));

    // 実際の削除処理を遅延実行 (4秒)
    const timerId = setTimeout(async () => {
      try {
        await removeBasketItem(itemId);
        delete stockDeleteTimers.current[itemId];
      } catch (error) {
        console.error("Failed to remove stock:", error);
        toast.error("銘柄の削除に失敗しました");
        if (selectedBasketId) fetchBasketItems(selectedBasketId);
      }
    }, 4000);

    stockDeleteTimers.current[itemId] = timerId;

    toast.custom(
      (t) => (
        <Alert className="bg-white w-full shadow-lg border-slate-200">
          <Trash2 className="h-4 w-4" />
          <AlertTitle>削除しました</AlertTitle>
          <AlertDescription className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-500">
              「{itemToDelete.name}」を削除しました
            </span>
            <button
              onClick={() => {
                if (stockDeleteTimers.current[itemId]) {
                  clearTimeout(stockDeleteTimers.current[itemId]);
                  delete stockDeleteTimers.current[itemId];
                }
                // 元に戻す
                setBasketItems((prev) => {
                  const newItems = [...prev];
                  // 元の位置に挿入し直す
                  if (originalIndex >= 0)
                    newItems.splice(originalIndex, 0, itemToDelete);
                  else newItems.push(itemToDelete);
                  return newItems;
                });
                toast.dismiss(t);
              }}
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 ml-4"
            >
              <Undo2 size={14} />
              元に戻す
            </button>
          </AlertDescription>
        </Alert>
      ),
      { duration: 4000 },
    );
  };

  const handleMoveStock = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    const newItems = [...basketItems];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setBasketItems(newItems);

    // Note: 順序を永続化するには、ここでAPIを呼び出して新しい順序を保存する必要があります
    // 例: await updateBasketItemOrder(selectedBasketId, newItems.map(i => i.id));
  };

  const selectedBasket = baskets.find((b) => b.id === selectedBasketId) || null;

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-4 gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-800">
              銘柄バスケット
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            独自のテーマで銘柄をグループ化し、まとめて監視・管理します。
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 min-h-125">
        {/* Sidebar: Basket List */}
        <div className="w-full lg:w-72 shrink-0">
          <BasketList
            baskets={baskets}
            selectedBasketId={selectedBasketId}
            isLoading={isLoadingBaskets}
            onSelect={setSelectedBasketId}
            onMove={handleMoveBasket}
            onCreate={() => {
              setEditingBasket(null);
              setIsBasketModalOpen(true);
            }}
          />
        </div>
        <main className="flex-1 min-w-0">
          <BasketDetail
            basket={selectedBasket}
            items={basketItems}
            isLoading={isLoadingItems}
            onEdit={(basket) => {
              setEditingBasket(basket);
              setIsBasketModalOpen(true);
            }}
            onDelete={handleDeleteBasket}
            onAddStock={() => setIsAddStockModalOpen(true)}
            onRemoveStock={handleRemoveStock}
            onMoveStock={handleMoveStock}
          />
        </main>
      </div>

      {/* Modals */}
      <BasketModal
        isOpen={isBasketModalOpen}
        onClose={() => setIsBasketModalOpen(false)}
        onSave={editingBasket ? handleUpdateBasket : handleCreateBasket}
        initialData={editingBasket}
      />

      <AddStockModal
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
        onAdd={handleAddStock}
      />
      <Toaster />
    </div>
  );
}
