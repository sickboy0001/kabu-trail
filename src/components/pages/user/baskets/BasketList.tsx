import { Plus, ShoppingBasket, ChevronUp, ChevronDown } from "lucide-react";
import { StockBasket } from "@/services/baskets";

type Props = {
  baskets: StockBasket[];
  selectedBasketId: number | null;
  isLoading: boolean;
  onSelect: (id: number) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  onCreate: () => void;
};

export function BasketList({
  baskets,
  selectedBasketId,
  isLoading,
  onSelect,
  onMove,
  onCreate,
}: Props) {
  return (
    <aside className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading ? (
          <div className="col-span-full text-center py-4 text-slate-400 text-sm">
            読み込み中...
          </div>
        ) : (
          <>
            {baskets.map((basket, index) => (
              <div
                key={basket.id}
                onClick={() => onSelect(basket.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all border group ${
                  selectedBasketId === basket.id
                    ? "bg-blue-50 border-blue-200 shadow-sm"
                    : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <ShoppingBasket
                        size={18}
                        className={
                          selectedBasketId === basket.id
                            ? "text-blue-600"
                            : "text-slate-400"
                        }
                      />
                      <span
                        className={`font-medium text-sm truncate ${
                          selectedBasketId === basket.id
                            ? "text-blue-800"
                            : "text-slate-700"
                        }`}
                      >
                        {basket.name}
                      </span>
                    </div>
                    {basket.description && (
                      <p className="text-xs text-slate-500 mt-1 pl-7 truncate">
                        {basket.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMove(index, "up");
                      }}
                      disabled={index === 0}
                      className="p-0.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      title="上に移動"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMove(index, "down");
                      }}
                      disabled={index === baskets.length - 1}
                      className="p-0.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                      title="下に移動"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={onCreate}
              className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all min-h-[80px]"
            >
              <Plus size={24} />
              <span className="text-sm font-medium">新規バスケット</span>
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
