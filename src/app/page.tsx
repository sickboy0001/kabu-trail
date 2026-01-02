import Link from "next/link";
import { TrendingUp, Globe, ArrowRight } from "lucide-react";

export default function LandingPage() {
  // ダミーのマーケットデータ
  const marketData = [
    {
      name: "日経平均",
      value: "38,500.25",
      change: "+1.2%",
      color: "text-green-600",
    },
    {
      name: "NYダウ",
      value: "39,120.50",
      change: "-0.5%",
      color: "text-red-600",
    },
    {
      name: "ドル/円",
      value: "150.12",
      change: "+0.05",
      color: "text-green-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ナビバー */}
      <nav className="flex justify-between items-center p-6 bg-white border-b">
        <h1 className="text-xl font-bold text-blue-600">KabuTrail</h1>
        <Link
          href="/login"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          ログインして管理を始める
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto py-12 px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">マーケット概況</h2>
          <p className="text-slate-600">現在の市場状況（ダミーデータ）</p>
        </div>

        {/* マーケットカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {marketData.map((item) => (
            <div
              key={item.name}
              className="bg-white p-6 rounded-xl shadow-sm border"
            >
              <p className="text-sm text-slate-500 mb-1">{item.name}</p>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className={`text-sm font-medium ${item.color}`}>
                {item.change}
              </p>
            </div>
          ))}
        </div>

        {/* 誘導セクション */}
        <div className="bg-blue-900 text-white p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">
              自分の資産を管理しましょう
            </h3>
            <p className="text-blue-200">
              一元管理、損益推移、カレンダー機能を全て無料で利用可能。
            </p>
          </div>
          <Link
            href="/login"
            className="mt-6 md:mt-0 flex items-center gap-2 bg-white text-blue-900 px-6 py-3 rounded-full font-bold hover:bg-blue-50 transition"
          >
            今すぐログイン <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    </div>
  );
}
