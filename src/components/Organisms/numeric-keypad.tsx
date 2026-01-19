"use client";

import { useState } from "react";
import { X, Delete, Check } from "lucide-react";

type Props = {
  title: string;
  initialValue: string;
  allowDecimal?: boolean;
  onConfirm: (val: string) => void;
  onClose: () => void;
};

export function NumericKeypad({
  title,
  initialValue,
  allowDecimal = false,
  onConfirm,
  onClose,
}: Props) {
  const [displayValue, setDisplayValue] = useState(initialValue);

  const handleInput = (char: string) => {
    // 小数点の処理
    if (char === ".") {
      if (displayValue.includes(".")) return; // 既に小数点がある場合は無視
      if (displayValue === "" || displayValue === "0") {
        setDisplayValue("0.");
        return;
      }
    }

    if (displayValue === "0") {
      // 0の状態で小数が来たら上で処理済み、それ以外（数字）なら置き換え
      // ただし入力が "." の場合は結合する（上のロジックでreturnしているのでここは通らないはずだが念のため）
      setDisplayValue(char === "." ? "0." : char);
    } else {
      setDisplayValue((prev) => prev + char);
    }
  };

  const handleBackspace = () => {
    setDisplayValue((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDisplayValue("");
  };

  const handleConfirm = () => {
    onConfirm(displayValue);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-70 bg-white rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
        {/* Header */}
        <div className="flex justify-between items-center p-3 border-b bg-slate-50">
          <h3 className="font-bold text-slate-700">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Display */}
        <div className="p-4 bg-slate-100 text-right border-b border-slate-200">
          <div className="text-3xl font-mono font-bold text-slate-800 h-10 overflow-hidden">
            {displayValue || <span className="text-slate-400">0</span>}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-px bg-slate-200">
          {["7", "8", "9", "4", "5", "6", "1", "2", "3"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleInput(num)}
              className="bg-white p-3 text-lg font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleInput("0")}
            className="bg-white p-3 text-lg font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleInput("00")}
            className={`bg-white p-3 text-lg font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors ${
              !allowDecimal ? "col-span-2" : ""
            }`}
          >
            00
          </button>
          {allowDecimal && (
            <button
              type="button"
              onClick={() => handleInput(".")}
              className="bg-white p-3 text-lg font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              .
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-px bg-slate-200 border-t border-slate-200">
          <button
            type="button"
            onClick={handleClear}
            className="bg-slate-50 p-3 text-base font-medium text-red-600 hover:bg-red-50 active:bg-red-100 transition-colors"
          >
            クリア
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="bg-white p-3 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <Delete size={24} />
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="bg-blue-600 p-3 text-base font-bold text-white hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2"
          >
            <Check size={20} />
            決定
          </button>
        </div>
      </div>
    </div>
  );
}
