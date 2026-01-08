import { Holding } from "./DashboardClient";

type Props = {
  holdings: Holding[];
};

export default function HoldingsTable({ holdings }: Props) {
  const formatYen = (num: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(num);
  };

  const formatPercent = (num: number) => {
    return num.toFixed(2) + "%";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">保有銘柄一覧</h2>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3 md:p-4 font-medium">銘柄</th>
              <th className="p-3 md:p-4 font-medium text-right">保有数量</th>
              <th className="p-3 md:p-4 font-medium text-right">
                取得コスト
                <span className="block text-xs font-normal text-slate-400">
                  (円)
                </span>
              </th>
              <th className="p-3 md:p-4 font-medium text-right">
                取得金額
                <span className="block text-xs font-normal text-slate-400">
                  (円)
                </span>
              </th>
              <th className="p-3 md:p-4 font-medium text-right">
                現在値(前日比)
                <span className="block text-xs font-normal text-slate-400">
                  (円)
                </span>
              </th>
              <th className="p-3 md:p-4 font-medium text-right">
                評価額
                <span className="block text-xs font-normal text-slate-400">
                  (円)
                </span>
              </th>
              <th className="p-3 md:p-4 font-medium text-right">
                評価損益
                <span className="block text-xs font-normal text-slate-400">
                  (円 / %)
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {holdings.map((stock) => {
              const valuation = stock.currentPrice * stock.quantity;
              const cost = stock.averagePrice * stock.quantity;
              const gainLoss = valuation - cost;
              const gainLossPercent = (gainLoss / cost) * 100;
              const isPositive = gainLoss >= 0;
              const dayChange = stock.currentPrice - stock.previousClose;
              const dayChangePercent = (dayChange / stock.previousClose) * 100;
              const isDayPositive = dayChange >= 0;

              return (
                <tr
                  key={stock.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="p-3 md:p-4">
                    <div className="font-bold text-slate-900">{stock.name}</div>
                    <div className="text-xs text-slate-500">{stock.code}</div>
                  </td>
                  <td className="p-3 md:p-4 text-right font-mono">
                    {stock.quantity.toLocaleString()} 株
                  </td>
                  <td className="p-3 md:p-4 text-right font-mono">
                    {formatYen(stock.averagePrice)}
                  </td>
                  <td className="p-3 md:p-4 text-right font-mono">
                    {formatYen(cost)}
                  </td>
                  <td className="p-3 md:p-4 text-right">
                    <div className="font-mono font-medium">
                      {formatYen(stock.currentPrice)}
                    </div>
                    <div
                      className={`text-xs ${
                        isDayPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isDayPositive ? "+" : ""}
                      {dayChange.toLocaleString()} ({isDayPositive ? "+" : ""}
                      {dayChangePercent.toFixed(2)}%)
                    </div>
                  </td>
                  <td className="p-3 md:p-4 text-right font-mono">
                    {formatYen(valuation)}
                  </td>
                  <td className="p-3 md:p-4 text-right">
                    <div
                      className={`font-bold font-mono ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {formatYen(gainLoss)}
                    </div>
                    <div
                      className={`text-xs ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {formatPercent(gainLossPercent)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* モバイル用カード表示 */}
      <div className="md:hidden divide-y divide-slate-100">
        {holdings.map((stock) => {
          const valuation = stock.currentPrice * stock.quantity;
          const cost = stock.averagePrice * stock.quantity;
          const gainLoss = valuation - cost;
          const gainLossPercent = (gainLoss / cost) * 100;
          const isPositive = gainLoss >= 0;
          const dayChange = stock.currentPrice - stock.previousClose;
          const dayChangePercent = (dayChange / stock.previousClose) * 100;
          const isDayPositive = dayChange >= 0;

          return (
            <div key={stock.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-900">{stock.name}</div>
                  <div className="text-xs text-slate-500">{stock.code}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-slate-900">
                    {formatYen(stock.currentPrice)}
                  </div>
                  <div
                    className={`text-xs ${
                      isDayPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isDayPositive ? "+" : ""}
                    {dayChange.toLocaleString()} ({isDayPositive ? "+" : ""}
                    {dayChangePercent.toFixed(2)}%)
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <div>
                  <div className="text-xs text-slate-500">保有数量</div>
                  <div className="font-mono">
                    {stock.quantity.toLocaleString()} 株
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">評価額</div>
                  <div className="font-mono">{formatYen(valuation)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">取得単価</div>
                  <div className="font-mono">
                    {formatYen(stock.averagePrice)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">評価損益</div>
                  <div
                    className={`font-mono font-bold ${
                      isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {formatYen(gainLoss)}
                  </div>
                  <div
                    className={`text-xs ${
                      isPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositive ? "+" : ""}
                    {formatPercent(gainLossPercent)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
