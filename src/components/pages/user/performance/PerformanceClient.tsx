"use client";

import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { ArrowUp, ArrowDown, Search } from "lucide-react";

type Props = {
  user: User;
};

// サンプルデータ構造
const transactions = [
  {
    id: 12,
    date: "25/12/10",
    settlementDate: "25/12/10",
    product: "株式",
    name: "2681ゲオホールディングス",
    type: "配当金",
    accountType: "特定",
    quantity: "500",
    unitPrice: "--",
    amount: "6,774",
    commission: "0",
    profit: "--",
    afterTaxProfit: "+5,398",
    returnRate: "--",
    holdingPeriod: "--",
    memo: "定期配当金",
  },
  {
    id: 13,
    date: "25/11/20",
    settlementDate: "25/11/25",
    product: "株式",
    name: "7203トヨタ自動車",
    type: "現物売却",
    accountType: "特定",
    quantity: "300",
    unitPrice: "2,950",
    amount: "885,000",
    commission: "4,800",
    profit: "+58,200",
    afterTaxProfit: "+46,376",
    returnRate: "+7.0%",
    holdingPeriod: "45日",
    memo: "円安進行に伴う業績上方修正期待で短期売買",
  },
  {
    id: 14,
    date: "25/10/15",
    settlementDate: "25/10/17",
    product: "株式",
    name: "8306三菱UFJ",
    type: "現物売却",
    accountType: "特定",
    quantity: "1,000",
    unitPrice: "1,450",
    amount: "1,450,000",
    commission: "5,200",
    profit: "+223,500",
    afterTaxProfit: "+178,096",
    returnRate: "+18.2%",
    holdingPeriod: "120日",
    memo: "金利上昇局面での利ざや拡大を狙い保有、目標達成",
  },
  {
    id: 15,
    date: "25/09/30",
    settlementDate: "25/10/02",
    product: "株式",
    name: "6758ソニーG",
    type: "現物売却",
    accountType: "特定",
    quantity: "100",
    unitPrice: "13,500",
    amount: "1,350,000",
    commission: "5,500",
    profit: "+118,000",
    afterTaxProfit: "+94,028",
    returnRate: "+9.6%",
    holdingPeriod: "35日",
    memo: "ゲーム事業の好調な決算発表を受けて上昇",
  },
  {
    id: 2,
    date: "25/08/05",
    settlementDate: "25/08/07",
    product: "株式",
    name: "1911住友林業",
    type: "現物売却",
    accountType: "特定",
    quantity: "600",
    unitPrice: "1,621",
    amount: "966,636",
    commission: "5,964",
    profit: "+121,236",
    afterTaxProfit: "+96,607",
    returnRate: "+14.3%",
    holdingPeriod: "61日",
    memo: "好決算期待で保有、目標達成につき売却",
  },
  {
    id: 3,
    date: "25/07/24",
    settlementDate: "25/07/28",
    product: "株式",
    name: "5401日本製鉄",
    type: "現物売却",
    accountType: "特定",
    quantity: "400",
    unitPrice: "3,005",
    amount: "1,195,018",
    commission: "6,982",
    profit: "-14,982",
    afterTaxProfit: "-14,982",
    returnRate: "-1.2%",
    holdingPeriod: "59日",
    memo: "中国景気減速懸念のため損切り",
  },

  {
    id: 6,
    date: "25/07/01",
    settlementDate: "25/07/01",
    product: "株式",
    name: "1911住友林業",
    type: "入庫（増減資）",
    accountType: "特定",
    quantity: "400",
    unitPrice: "--",
    amount: "--",
    commission: "--",
    profit: "--",
    afterTaxProfit: "--",
    returnRate: "--",
    holdingPeriod: "--",
    memo: "株式分割に伴う入庫",
  },
  {
    id: 7,
    date: "25/06/10",
    settlementDate: "25/06/12",
    product: "株式",
    name: "5590ネットスターズ",
    type: "現物買付",
    accountType: "特定",
    quantity: "1,000",
    unitPrice: "940",
    amount: "945,810",
    commission: "5,810",
    profit: "--",
    afterTaxProfit: "--",
    returnRate: "--",
    holdingPeriod: "--",
    memo: "キャッシュレス化の進展に期待",
  },
  {
    id: 8,
    date: "25/06/05",
    settlementDate: "25/06/09",
    product: "株式",
    name: "1911住友林業",
    type: "現物買付",
    accountType: "特定",
    quantity: "200",
    unitPrice: "4,200",
    amount: "845,337",
    commission: "5,337",
    profit: "--",
    afterTaxProfit: "--",
    returnRate: "--",
    holdingPeriod: "--",
    memo: "米国住宅市場の底打ち感から",
  },
  {
    id: 9,
    date: "25/05/26",
    settlementDate: "25/05/28",
    product: "株式",
    name: "5401日本製鉄",
    type: "現物買付",
    accountType: "特定",
    quantity: "400",
    unitPrice: "3,000",
    amount: "1,209,763",
    commission: "9,763",
    profit: "--",
    afterTaxProfit: "--",
    returnRate: "--",
    holdingPeriod: "--",
    memo: "PBR1倍割れ是正期待",
  },
  {
    id: 10,
    date: "25/05/23",
    settlementDate: "25/05/23",
    product: "現金",
    name: "振込",
    type: "入金（振込）",
    accountType: "",
    quantity: "--",
    unitPrice: "--",
    amount: "3,000,000",
    commission: "0",
    profit: "--",
    afterTaxProfit: "--",
    returnRate: "--",
    holdingPeriod: "--",
    memo: "投資資金追加",
  },
  {
    id: 11,
    date: "25/05/20",
    settlementDate: "25/05/22",
    product: "株式",
    name: "2681ゲオホールディングス",
    type: "現物買付",
    accountType: "特定",
    quantity: "500",
    unitPrice: "1,601",
    amount: "807,709",
    commission: "7,209",
    profit: "--",
    afterTaxProfit: "--",
    returnRate: "--",
    holdingPeriod: "--",
    memo: "リユース市場の拡大期待",
  },
];

export default function PerformanceClient({ user }: Props) {
  const [filterText, setFilterText] = useState("");

  const parseBalance = (val: string) => {
    if (!val || val === "--") return null;
    return parseInt(val.replace(/,/g, ""), 10);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">損益推移</h1>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800 text-sm">
          ※このページは現在実装中です。表示されているデータは開発用のサンプルデータです。
        </p>
      </div>

      {/* PC版: テーブル表示 (md以上で表示) */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
        <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-2">約定日</th>
              <th className="p-2">商品</th>
              <th className="p-2">銘柄/摘要</th>
              <th className="p-2">取引区分</th>
              <th className="p-2 text-right">数量/単価</th>
              <th className="p-2 text-right">受渡金額/決済損益</th>
              <th className="p-2 text-right">手数料(税込)</th>
              <th className="p-2 text-right">保有期間</th>
              <th className="p-2 text-right">売買損益 / 騰落率</th>
              <th className="p-2 text-right">課税後損益</th>
              <th className="p-2">投資理由</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b hover:bg-slate-50">
                <td className="p-2">{t.date}</td>
                <td className="p-2">{t.product}</td>
                <td className="p-2 font-medium">{t.name}</td>
                <td className="p-2">
                  {t.type.includes("（") ? (
                    <>
                      <div>{t.type.split("（")[0]}</div>
                      <div className="text-xs text-slate-500">
                        {t.type.split("（")[1].replace("）", "")}
                      </div>
                    </>
                  ) : (
                    t.type
                  )}
                </td>
                <td className="p-2 text-right font-mono">
                  {t.quantity === "--" && t.unitPrice === "--" ? (
                    "--"
                  ) : (
                    <>
                      <div>{t.quantity}</div>
                      <div className="text-xs text-slate-500">
                        {t.unitPrice}
                      </div>
                    </>
                  )}
                </td>
                <td className="p-2 text-right font-mono">
                  {t.amount !== "--" ? `¥${t.amount}` : "--"}
                </td>
                <td className="p-2 text-right font-mono">{t.commission}</td>
                <td className="p-2 text-right font-mono">{t.holdingPeriod}</td>
                <td className="p-2 text-right font-mono">
                  <div
                    className={
                      t.profit.startsWith("+")
                        ? "text-green-600"
                        : t.profit.startsWith("-")
                          ? "text-red-600"
                          : ""
                    }
                  >
                    {t.profit}
                  </div>
                  <div
                    className={`text-xs ${
                      t.returnRate.startsWith("+")
                        ? "text-green-600"
                        : t.returnRate.startsWith("-")
                          ? "text-red-600"
                          : "text-slate-500"
                    }`}
                  >
                    {t.returnRate}
                  </div>
                </td>
                <td
                  className={`p-2 text-right font-mono ${
                    t.afterTaxProfit.startsWith("+")
                      ? "text-green-600"
                      : t.afterTaxProfit.startsWith("-")
                        ? "text-red-600"
                        : ""
                  }`}
                >
                  {t.afterTaxProfit}
                </td>
                <td className="p-2 text-sm text-slate-600 whitespace-normal min-w-[200px]">
                  {t.memo}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
