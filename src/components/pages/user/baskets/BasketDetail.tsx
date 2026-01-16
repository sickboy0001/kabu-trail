import { useState } from "react";
import Link from "next/link";
import {
  Pencil,
  Trash2,
  Plus,
  Loader2,
  X,
  ShoppingBasket,
  GripVertical,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StockBasket, StockBasketItem } from "@/services/baskets";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtLarge } from "@/lib/utilNumber";

export type BasketItemWithInfo = StockBasketItem & {
  name: string;
  market?: string;
  currentPrice?: number | null;
  currentPriceDate?: string | null;
  priceChange?: number | null;
  priceChangePercent?: number | null;
  volume?: number | null;
  prevClose?: number | null;
  open?: number | null;
  low?: number | null;
  high?: number | null;
  tradingValue?: number | null;
};

type Props = {
  basket: StockBasket | null;
  items: BasketItemWithInfo[];
  isLoading: boolean;
  onEdit: (basket: StockBasket) => void;
  onDelete: (id: number) => void;
  onAddStock: () => void;
  onRemoveStock: (itemId: number) => void;
  onMoveStock: (fromIndex: number, toIndex: number) => void;
};

export function BasketDetail({
  basket,
  items,
  isLoading,
  onEdit,
  onDelete,
  onAddStock,
  onRemoveStock,
  onMoveStock,
}: Props) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (!basket) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 min-h-96">
        <ShoppingBasket size={48} className="mb-4 opacity-20" />
        <p>バスケットを選択するか、新規作成してください</p>
      </div>
    );
  }

  return (
    <Card className="h-full border-slate-200 shadow-sm">
      <CardHeader className="pb-4 border-b border-slate-100">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl text-slate-800 flex items-center gap-2">
              {basket.name}
            </CardTitle>
            {basket.description && (
              <CardDescription className="mt-1 text-slate-500">
                {basket.description}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(basket)}
              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="編集"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => onDelete(basket.id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="削除"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium text-slate-700 flex items-center gap-2">
            構成銘柄 <Badge variant="secondary">{items.length}</Badge>
          </h3>
          <button
            onClick={onAddStock}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
          >
            <Plus size={16} />
            銘柄を追加
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10 text-slate-400">
            <Loader2 className="animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            <p className="text-slate-500 text-sm mb-2">
              銘柄が登録されていません
            </p>
            <button
              onClick={onAddStock}
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              銘柄を追加する
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-1 sm:px-2 py-3 w-8 h-auto"></TableHead>
                    <TableHead className="px-1 sm:px-2 py-3 w-10 text-center h-auto text-xs font-medium text-slate-500 uppercase">
                      操作
                    </TableHead>
                    <TableHead className="px-1 sm:px-2 py-3 min-w-30 sm:min-w-45 h-auto text-xs font-medium text-slate-500 uppercase">
                      コード・市場・名称
                    </TableHead>
                    <TableHead className="hidden sm:table-cell px-2 py-3 w-16 text-center h-auto text-xs font-medium text-slate-500 uppercase">
                      チャート
                    </TableHead>
                    <TableHead className="px-2 py-3 text-right whitespace-nowrap h-auto text-xs font-medium text-slate-500 uppercase">
                      現在値
                    </TableHead>
                    <TableHead className="px-2 py-3 text-right whitespace-nowrap h-auto text-xs font-medium text-slate-500 uppercase">
                      前日比
                    </TableHead>
                    <TableHead className="px-2 py-3 text-right whitespace-nowrap h-auto text-xs font-medium text-slate-500 uppercase">
                      出来高
                    </TableHead>
                    <TableHead className="px-2 py-3 text-right whitespace-nowrap h-auto text-xs font-medium text-slate-500 uppercase">
                      前日終値
                    </TableHead>
                    <TableHead className="px-2 py-3 text-right whitespace-nowrap h-auto text-xs font-medium text-slate-500 uppercase">
                      始値
                    </TableHead>
                    <TableHead className="px-2 py-3 text-right whitespace-nowrap h-auto text-xs font-medium text-slate-500 uppercase">
                      安値
                    </TableHead>
                    <TableHead className="px-2 py-3 text-right whitespace-nowrap h-auto text-xs font-medium text-slate-500 uppercase">
                      高値
                    </TableHead>
                    <TableHead className="px-2 py-3 text-right whitespace-nowrap h-auto text-xs font-medium text-slate-500 uppercase">
                      売買代金
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        setDraggedIndex(index);
                        e.dataTransfer.effectAllowed = "move" as const;
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move" as const;
                        if (draggedIndex !== null && draggedIndex !== index) {
                          setDragOverIndex(index);
                        }
                      }}
                      onDragEnd={() => {
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedIndex !== null && draggedIndex !== index) {
                          onMoveStock(draggedIndex, index);
                        }
                        setDraggedIndex(null);
                        setDragOverIndex(null);
                      }}
                      className={`group hover:bg-slate-50 ${
                        draggedIndex === index ? "opacity-50 bg-blue-50" : ""
                      } ${
                        dragOverIndex === index && draggedIndex !== index
                          ? "shadow-[inset_0_2px_0_0_#2563eb]"
                          : ""
                      }`}
                    >
                      <TableCell className="px-1 sm:px-2 py-3 text-center">
                        <div className="cursor-grab text-slate-300 hover:text-slate-500 active:cursor-grabbing flex justify-center">
                          <GripVertical size={16} />
                        </div>
                      </TableCell>
                      <TableCell className="px-1 sm:px-2 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onRemoveStock(item.id)}
                            className="text-slate-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
                            title="削除"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="px-1 sm:px-2 py-3">
                        <Link
                          href={`/stock?code=${item.stock_code}`}
                          className="flex flex-col group/link"
                        >
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-mono font-bold text-slate-900 group-hover/link:text-blue-600 group-hover/link:underline">
                              {item.stock_code}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">
                              {item.market || "東証"}
                            </span>
                          </div>
                          <span className="text-slate-700 font-medium line-clamp-1 sm:truncate max-w-30 sm:max-w-45 group-hover/link:text-blue-600 group-hover/link:underline">
                            {item.name}
                          </span>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell px-2 py-3 text-center">
                        <Link
                          href={`/stock?code=${item.stock_code}`}
                          className="flex justify-center cursor-pointer hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={`https://finance.yahoo.co.jp/chart-image-proxy/ex/v1/common/chart/image?code=${item.stock_code}.T&chartSize=50x32`}
                            alt={`${item.name}のチャート`}
                            width={100}
                            height={64}
                            className="inline-block"
                          />
                        </Link>
                      </TableCell>
                      <TableCell className="px-2 py-3 text-right whitespace-nowrap">
                        <div className="font-mono font-medium text-slate-900">
                          {item.currentPrice?.toLocaleString() ?? "---"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.currentPriceDate ?? "--/--"}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-3 text-right whitespace-nowrap">
                        <div
                          className={`font-mono font-medium ${
                            (item.priceChange ?? 0) > 0
                              ? "text-red-600"
                              : (item.priceChange ?? 0) < 0
                                ? "text-green-600"
                                : "text-slate-500"
                          }`}
                        >
                          {(item.priceChange ?? 0) > 0 ? "+" : ""}
                          {item.priceChange?.toLocaleString() ?? "---"}
                        </div>
                        <div
                          className={`text-xs ${
                            (item.priceChangePercent ?? 0) > 0
                              ? "text-red-600"
                              : (item.priceChangePercent ?? 0) < 0
                                ? "text-green-600"
                                : "text-slate-500"
                          }`}
                        >
                          {(item.priceChangePercent ?? 0) > 0 ? "+" : ""}
                          {item.priceChangePercent?.toFixed(2) ?? "---"}%
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-3 text-right whitespace-nowrap font-mono text-slate-700">
                        <div>{item.volume?.toLocaleString() ?? "---"}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.currentPriceDate ?? "--/--"}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-3 text-right whitespace-nowrap font-mono text-slate-700">
                        <div>{item.prevClose?.toLocaleString() ?? "---"}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.currentPriceDate ?? "--/--"}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-3 text-right whitespace-nowrap font-mono text-slate-700">
                        <div>{item.open?.toLocaleString() ?? "---"}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.currentPriceDate ?? "--/--"}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-3 text-right whitespace-nowrap font-mono text-slate-700">
                        <div>{item.low?.toLocaleString() ?? "---"}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.currentPriceDate ?? "--/--"}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-3 text-right whitespace-nowrap font-mono text-slate-700">
                        <div>{item.high?.toLocaleString() ?? "---"}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.currentPriceDate ?? "--/--"}
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-3 text-right whitespace-nowrap font-mono text-slate-700">
                        <div>{fmtLarge(item.tradingValue, "円")}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.currentPriceDate ?? "--/--"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
