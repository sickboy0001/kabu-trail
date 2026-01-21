import { MouseEvent } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  Pencil,
  Trash2,
  RefreshCcw,
  MessageSquarePlus,
  TrendingUp,
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
  onAddNote?: (e: MouseEvent, stock: StockInfo | StockInfo[]) => void;
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
        <div className="absolute bottom-2 right-2 flex gap-1 transition-all z-10 bg-white/90 rounded-full p-0.5 shadow-sm border border-slate-100">
          {log.stocks.length > 0 && (
            <Link
              href={`/stock?code=${log.stocks[0].code}`}
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
              title="チャート画面へ"
            >
              <TrendingUp size={14} />
            </Link>
          )}
          <button
            onClick={(e) => onEdit(e, log)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
            title="編集"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => onDelete(e, log.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
            title="削除（無効化）"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}

      <CardHeader className="p-3 pb-1">
        <div className="flex items-center gap-2">
          <div className="flex items-center text-[10px] text-slate-400 whitespace-nowrap shrink-0">
            <CalendarIcon className="mr-1 h-3 w-3" />
            {log.date}
          </div>
          <div className="flex flex-wrap gap-1">
            {log.stocks.map((stock) => (
              <Badge
                key={stock.code}
                variant="secondary"
                className="bg-slate-200 text-slate-700 font-bold whitespace-nowrap hover:bg-slate-300 cursor-pointer transition-colors px-1.5 py-0 text-[10px] h-5"
                onClick={(e) => {
                  e.stopPropagation();
                  onStockClick?.(stock.name);
                }}
              >
                <span
                  className="max-w-24 truncate block"
                  title={`[${stock.code}] ${stock.name}`}
                >
                  {stock.code} {stock.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddNote?.(e, stock);
                  }}
                  className="ml-1 p-0.5 text-slate-500 hover:text-blue-600 hover:bg-white/50 rounded-full transition-colors"
                  title={`${stock.name}について新規メモを作成`}
                >
                  <MessageSquarePlus size={12} />
                </button>
              </Badge>
            ))}
            {log.stocks.length === 0 && (
              <span className="text-xs font-bold text-slate-500 px-1">
                Note
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1">
        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
          {log.content}
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 min-h-20px">
          <div className="flex flex-wrap gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
            {log.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] bg-white border px-1 py-0 rounded text-slate-500"
              >
                #{tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {!log.isActive && (
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-red-500">
                  削除済
                </span>
                <button
                  onClick={(e) => onReactivate(e, log.id)}
                  className="text-slate-400 hover:text-blue-600 transition-colors p-1 hover:bg-blue-50 rounded-full"
                  title="有効化"
                >
                  <RefreshCcw size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
