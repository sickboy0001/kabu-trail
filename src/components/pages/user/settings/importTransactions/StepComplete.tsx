"use client";

import { CheckCircle2 } from "lucide-react";

type Props = {
  onReset: () => void;
};

export default function StepComplete({ onReset }: Props) {
  return (
    <div className="max-w-md mx-auto text-center space-y-6 py-12">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle2 size={40} />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          インポート完了
        </h2>
        <p className="text-slate-600">
          取引データのインポートが正常に完了しました。
        </p>
      </div>
      <div className="flex justify-center gap-4 pt-4">
        <button
          onClick={onReset}
          className="text-blue-600 hover:bg-blue-50 px-6 py-2 rounded-lg border border-blue-200 transition-colors"
        >
          続けてインポート
        </button>
        <a
          href="/cashflows"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-sm transition-colors"
        >
          取引一覧へ戻る
        </a>
      </div>
    </div>
  );
}
