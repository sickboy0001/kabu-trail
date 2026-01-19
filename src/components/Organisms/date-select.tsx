"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  value: string;
  onChange: (date: string) => void;
};

export function DateSelect({ value, onChange }: Props) {
  const adjustDate = (days: number) => {
    if (!value) return;
    const d = new Date(value);
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    onChange(`${year}-${month}-${day}`);
  };

  const getDayOfWeek = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return days[date.getDay()];
  };

  return (
    <div className="flex rounded-lg shadow-sm">
      <div className="relative flex-1 flex items-center border border-slate-300 rounded-l-lg border-r-0 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 focus-within:z-10">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border-none focus:ring-0 p-2.5 bg-transparent outline-none rounded-l-lg"
        />
        <span className="text-sm font-medium text-slate-500 pr-3 whitespace-nowrap pointer-events-none">
          ({getDayOfWeek(value)})
        </span>
      </div>
      <button
        type="button"
        onClick={() => adjustDate(-1)}
        className="px-3 py-2.5 bg-slate-50 border border-slate-300 border-r-0 hover:bg-slate-100 text-slate-600 transition-colors active:scale-95"
        title="前日へ"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        onClick={() => adjustDate(1)}
        className="px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-r-lg hover:bg-slate-100 text-slate-600 transition-colors active:scale-95"
        title="翌日へ"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
