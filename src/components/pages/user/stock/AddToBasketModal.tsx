import { useState, useEffect } from "react";
import { X, ShoppingBasket, Plus, Check, Loader2 } from "lucide-react";
import {
  getBaskets,
  addBasketItem,
  type StockBasket,
} from "@/services/baskets";
import { getBasketsContainingStock } from "@/services/stocks";
import { toast } from "sonner";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  stockCode: string;
  stockName?: string;
};

export function AddToBasketModal({
  isOpen,
  onClose,
  userId,
  stockCode,
  stockName,
}: Props) {
  const [baskets, setBaskets] = useState<StockBasket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addingToId, setAddingToId] = useState<number | null>(null);
  const [addedBasketIds, setAddedBasketIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen && userId) {
      fetchBaskets();
      checkAddedBaskets();
    }
  }, [isOpen, userId]);

  const fetchBaskets = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const data = await getBaskets(userId);
      setBaskets(data);
    } catch (error) {
      console.error("Failed to fetch baskets:", error);
      toast.error("バスケット情報の取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  const checkAddedBaskets = async () => {
    if (!userId) return;
    try {
      const addedBaskets = await getBasketsContainingStock(userId, stockCode);
      setAddedBasketIds(new Set(addedBaskets.map((b) => b.id)));
    } catch (error) {
      console.error("Failed to check added baskets:", error);
    }
  };

  const handleAddToBasket = async (basket: StockBasket) => {
    try {
      setAddingToId(basket.id);
      await addBasketItem(basket.id, stockCode);
      toast.success(
        `${basket.name} に ${stockName || stockCode} を追加しました`
      );
      setAddedBasketIds((prev) => new Set(prev).add(basket.id));
      onClose();
    } catch (error) {
      console.error("Failed to add stock to basket:", error);
      toast.error(
        "バスケットへの追加に失敗しました（既に追加済みの可能性があります）"
      );
    } finally {
      setAddingToId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <ShoppingBasket size={18} className="text-blue-600" />
            バスケットに追加
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8 text-slate-400">
              <Loader2 className="animate-spin" />
            </div>
          ) : baskets.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="mb-2">バスケットがありません</p>
              <p className="text-xs text-slate-400">
                バスケット管理画面で作成してください
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {baskets.map((basket) => {
                const isAdded = addedBasketIds.has(basket.id);
                return (
                  <li key={basket.id}>
                    <button
                      onClick={() => handleAddToBasket(basket)}
                      disabled={addingToId !== null || isAdded}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${
                        isAdded
                          ? "bg-emerald-50 border-emerald-200 cursor-default"
                          : "border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <div>
                        <div
                          className={`font-medium ${
                            isAdded
                              ? "text-emerald-800"
                              : "text-slate-800 group-hover:text-blue-700"
                          }`}
                        >
                          {basket.name}
                        </div>
                        {basket.description && (
                          <div className="text-xs text-slate-500 truncate max-w-[250px]">
                            {basket.description}
                          </div>
                        )}
                      </div>
                      {addingToId === basket.id ? (
                        <Loader2
                          size={18}
                          className="animate-spin text-blue-600"
                        />
                      ) : isAdded ? (
                        <div className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <span>追加済み</span>
                          <Check size={18} />
                        </div>
                      ) : (
                        <Plus
                          size={18}
                          className="text-slate-300 group-hover:text-blue-600"
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
