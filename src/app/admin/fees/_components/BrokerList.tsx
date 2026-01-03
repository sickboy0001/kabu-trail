"use client";

import Link from "next/link";
import { ChevronRight, Landmark, FileText, Plus } from "lucide-react";
// import { cn } from "@/src/lib/utils"; // Shadcnのユーティリティ（なければ適宜書き換え）
import { cn } from "@/lib/utils";

export default function BrokerList({ brokers, selectedId }: any) {
  return (
    <div className="space-y-6">
      {brokers.map((broker: any) => (
        <div key={broker.id} className="space-y-2">
          {/* 証券会社名 */}
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Landmark className="w-4 h-4 text-blue-600" />
            <span>{broker.name}</span>
            <span className="text-[10px] bg-slate-200 px-1 rounded ml-auto">
              ID: {broker.id}
            </span>
          </div>

          {/* プラン（テンプレート）一覧 */}
          <div className="ml-3 border-l-2 border-slate-200 pl-3 space-y-1">
            {broker.fee_templates?.map((template: any) => (
              <Link
                key={template.id}
                href={`?brokerId=${broker.id}&templateId=${template.id}`}
                className={cn(
                  "flex items-center gap-2 p-2 text-sm rounded-md transition-colors",
                  selectedId === String(template.id)
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "hover:bg-slate-100 text-slate-600"
                )}
              >
                <FileText className="w-3 h-3" />
                <span className="truncate">{template.name}</span>
                {selectedId === String(template.id) && (
                  <ChevronRight className="w-3 h-3 ml-auto" />
                )}
              </Link>
            ))}

            {/* 新規プラン追加ボタン（ダミー） */}
            <button className="flex items-center gap-2 p-2 text-xs text-slate-400 hover:text-blue-600 transition-colors">
              <Plus className="w-3 h-3" />
              <span>プランを追加</span>
            </button>
          </div>
        </div>
      ))}

      {/* 証券会社追加ボタン（ダミー） */}
      <button className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-500 hover:bg-slate-50 flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" />
        証券会社を追加
      </button>
    </div>
  );
}
