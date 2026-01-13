import { MouseEvent } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  Pencil,
  Trash2,
  RefreshCcw,
  MessageSquarePlus,
} from "lucide-react";
import { type StockInfo } from "@/services/stocks";

type ObservationLogWithStockInfo = {
  id: number;
  isActive: boolean;
  stocks: StockInfo[];
  date: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

type Props = {
  log: ObservationLogWithStockInfo;
  onEdit: (e: MouseEvent, log: any) => void;
  onDelete: (e: MouseEvent, id: number) => void;
  onReactivate: (e: MouseEvent, id: number) => void;
  onStockClick?: (name: string) => void;
  onAddNote?: (e: MouseEvent, stock: StockInfo) => void;
};

export function ObservationLogCard({
  log,
  onEdit,
  onDelete,
  onReactivate,
  onStockClick,
  onAddNote,
}: Props) {
  return (
    <Card
      onClick={(e) => log.isActive && onEdit(e, log)}
      className={`border-slate-200 hover:shadow-md transition-all duration-200 cursor-pointer group relative ${
        log.isActive ? "bg-yellow-50/30" : "bg-gray-100 opacity-70"
      }`}
    >
      {/* 操作ボタンエリア */}
      {log.isActive && (
        <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
          <button
            onClick={(e) => onEdit(e, log)}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
            title="編集"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => onDelete(e, log.id)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
            title="削除（無効化）"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}

      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div className="flex flex-wrap gap-1.5 max-w-[70%]">
            {log.stocks.map((stock) => (
              <Badge
                key={stock.code}
                variant="secondary"
                className="bg-slate-200 text-slate-700 font-bold whitespace-nowrap hover:bg-slate-300 cursor-pointer transition-colors pr-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onStockClick?.(stock.name);
                }}
              >
                <span
                  className="max-w-30 truncate block"
                  title={`[${stock.code}] ${stock.name}`}
                >
                  [{stock.code}] {stock.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddNote?.(e, stock);
                  }}
                  className="ml-1.5 p-0.5 text-slate-500 hover:text-blue-600 hover:bg-white/50 rounded-full transition-colors"
                  title={`${stock.name}について新規メモを作成`}
                >
                  <MessageSquarePlus size={14} />
                </button>
              </Badge>
            ))}
            {log.stocks.length === 0 && (
              <span className="text-sm font-bold text-slate-600">Note</span>
            )}
          </div>
          <Badge
            variant="outline"
            className="text-xs font-normal text-slate-500 bg-white/50"
          >
            <CalendarIcon className="mr-1 h-3 w-3" />
            {log.date}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {log.content}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
          {log.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-slate-500"
            >
              #{tag}
            </span>
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">
              入力: {log.createdAt}
            </span>
            {log.createdAt !== log.updatedAt && (
              <span className="text-[10px] text-slate-400">
                更新: {log.updatedAt}
              </span>
            )}
          </div>
          {!log.isActive && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-red-500">
                削除済み
              </span>
              <button
                onClick={(e) => onReactivate(e, log.id)}
                className="text-slate-400 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 rounded-full"
                title="有効化"
              >
                <RefreshCcw size={14} />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
