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
    id: 1,
    date: "25/08/07",
    settlementDate: "25/08/07",
    product: "現金",
    name: "譲渡益税源泉徴収金",
    type: "出金（振替）",
    accountType: "",
    quantity: "--",
    unitPrice: "--",
    amount: "21,584",
    commission: "0",
    profit: "--",
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
  },
  {
    id: 4,
    date: "25/07/14",
    settlementDate: "25/07/14",
    product: "投信",
    name: "野村インド株投資",
    type: "入金（分配金）",
    accountType: "",
    quantity: "1,244,054",
    unitPrice: "500",
    amount: "49,656",
    commission: "--",
    profit: "--",
  },
  {
    id: 5,
    date: "25/07/11",
    settlementDate: "25/07/14",
    product: "投信",
    name: "野村インド株投資",
    type: "現物再投",
    accountType: "特定",
    quantity: "10,608",
    unitPrice: "46,813",
    amount: "49,656",
    commission: "0",
    profit: "--",
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
  },
];

const cashBalanceHistory = [
  {
    id: "cb-0",
    settlementDate: "",
    tradeDate: "",
    type: "",
    description: "繰越残高",
    quantity: "",
    unitPrice: "",
    amount: "",
    balanceMRF: "1,824,585",
  },
  {
    id: "cb-1",
    settlementDate: "25/12/10",
    tradeDate: "--/--/--",
    type: "株式配当金",
    description: "ゲオホールディングス",
    quantity: "500",
    unitPrice: "--",
    amount: "+6,774",
    balanceMRF: "1,831,359",
  },
  {
    id: "cb-3",
    settlementDate: "25/12/18",
    tradeDate: "25/12/16",
    type: "売却",
    description: "川崎重工業",
    quantity: "100",
    unitPrice: "11,930",
    amount: "+1,186,057",
    balanceMRF: "3,017,416",
  },
  {
    id: "cb-4",
    settlementDate: "25/12/18",
    tradeDate: "25/12/16",
    type: "買付",
    description: "ライトアップ",
    quantity: "400",
    unitPrice: "2,978",
    amount: "-1,198,134",
    balanceMRF: "1,819,282",
  },
  {
    id: "cb-5",
    settlementDate: "25/12/18",
    tradeDate: "--/--/--",
    type: "--",
    description: "譲渡益税源泉徴収金",
    quantity: "--",
    unitPrice: "--",
    amount: "-24,409",
    balanceMRF: "1,794,873",
  },
  {
    id: "cb-7",
    settlementDate: "25/12/23",
    tradeDate: "25/12/19",
    type: "売却",
    description: "ゲオホールディングス",
    quantity: "500",
    unitPrice: "1,830",
    amount: "+909,309",
    balanceMRF: "2,704,182",
  },
  {
    id: "cb-8",
    settlementDate: "25/12/23",
    tradeDate: "25/12/19",
    type: "買付",
    description: "ソフトバンク",
    quantity: "5,000",
    unitPrice: "218.2",
    amount: "-1,097,494",
    balanceMRF: "1,606,688",
  },
  {
    id: "cb-9",
    settlementDate: "25/12/23",
    tradeDate: "--/--/--",
    type: "--",
    description: "譲渡益税源泉徴収金",
    quantity: "--",
    unitPrice: "--",
    amount: "-20,580",
    balanceMRF: "1,586,108",
  },
  {
    id: "cb-11",
    settlementDate: "25/12/24",
    tradeDate: "25/12/22",
    type: "買付",
    description: "大阪製鐵",
    quantity: "400",
    unitPrice: "2,784",
    amount: "-1,120,193",
    balanceMRF: "465,915",
  },
  {
    id: "cb-13",
    settlementDate: "25/12/29",
    tradeDate: "25/12/25",
    type: "売却",
    description: "大阪製鐵",
    quantity: "800",
    unitPrice: "2,805",
    amount: "+2,232,433",
    balanceMRF: "2,698,348",
  },
  {
    id: "cb-14",
    settlementDate: "25/12/29",
    tradeDate: "--/--/--",
    type: "--",
    description: "譲渡益税源泉徴収金",
    quantity: "--",
    unitPrice: "--",
    amount: "-8,213",
    balanceMRF: "2,690,135",
  },
  {
    id: "cb-16",
    settlementDate: "25/12/30",
    tradeDate: "--/--/--",
    type: "--",
    description: "ＭＲＦ分配金",
    quantity: "--",
    unitPrice: "--",
    amount: "+417",
    balanceMRF: "2,690,552",
  },
  {
    id: "cb-17",
    settlementDate: "25/12/30",
    tradeDate: "25/12/30",
    type: "--",
    description: "ＭＲＦ再投資",
    quantity: "--",
    unitPrice: "--",
    amount: "-417",
    balanceMRF: "2,690,552",
  },
];

export default function AccountListClient({ user }: Props) {
  const [filterText, setFilterText] = useState("");

  const parseBalance = (val: string) => {
    if (!val || val === "--") return null;
    return parseInt(val.replace(/,/g, ""), 10);
  };

  const filteredCashBalanceHistory = cashBalanceHistory.filter((item) => {
    const search = filterText.toLowerCase();
    return (
      item.settlementDate.includes(search) ||
      item.tradeDate.includes(search) ||
      item.description.toLowerCase().includes(search) ||
      item.type.includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">資産推移</h1>
      </div>
      <div>
        この表は「現金の動き（キャッシュフロー）」を追うのに適しています。
        <p>取引の連鎖:</p>
        12/18の川崎重工業の売却益を原資にライトアップを購入し、さらに12/23にはゲオの売却益と合わせてソフトバンクを購入…といった、資産の「入れ替え」の流れが明確です。
        <p>残高の管理:</p>
        右端の「残高」列を見ることで、常に買い付け余力がいくらあるのかがリアルタイムで把握できています。
        <p>税金の意識:</p>
        「譲渡益税源泉徴収金」がマイナス表記されているため、利益に対して約20%の税金が引かれた後の**「真の純増額」**が計算されています。
      </div>
      {/* 金銭残高明細 */}
      <div className="space-y-4 pt-8 border-t border-slate-200">
        {/* PC版: テーブル表示 */}
        <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4">受渡日</th>
                <th className="p-4">約定日</th>
                <th className="p-4">取引区分</th>
                <th className="p-4">摘要</th>
                <th className="p-4 text-right">数量</th>
                <th className="p-4 text-right">単価</th>
                <th className="p-4 text-right">精算金額</th>
                <th className="p-4 text-right">残高</th>
              </tr>
            </thead>
            <tbody>
              {filteredCashBalanceHistory.map((item, index) => {
                const current = parseBalance(item.balanceMRF);
                const prev =
                  index > 0
                    ? parseBalance(
                        filteredCashBalanceHistory[index - 1].balanceMRF
                      )
                    : null;
                let trend = null;
                if (current !== null && prev !== null) {
                  if (current > prev) trend = "up";
                  if (current < prev) trend = "down";
                }

                return (
                  <tr key={item.id} className="border-b hover:bg-slate-50">
                    <td className="p-4">{item.settlementDate}</td>
                    <td className="p-4">{item.tradeDate}</td>
                    <td className="p-4">{item.type}</td>
                    <td className="p-4 font-medium">{item.description}</td>
                    <td className="p-4 text-right font-mono">
                      {item.quantity}
                    </td>
                    <td className="p-4 text-right font-mono">
                      {item.unitPrice}
                    </td>
                    <td
                      className={`p-4 text-right font-mono ${
                        item.amount.startsWith("+")
                          ? "text-green-600"
                          : item.amount.startsWith("-")
                          ? "text-red-600"
                          : ""
                      }`}
                    >
                      {item.amount}
                    </td>
                    <td className="p-4 text-right font-mono">
                      <div className="flex items-center justify-end gap-1">
                        {trend === "up" && (
                          <ArrowUp size={14} className="text-green-600" />
                        )}
                        {trend === "down" && (
                          <ArrowDown size={14} className="text-red-600" />
                        )}
                        <span
                          className={
                            trend === "up"
                              ? "text-green-600"
                              : trend === "down"
                              ? "text-red-600"
                              : ""
                          }
                        >
                          {item.balanceMRF}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
