"use client";

import React, { useEffect, useState } from "react";
import { fetchStockDetails, type StockDetails } from "@/lib/stockApi";
import {
  getStockInfoJpxMaster,
  getBasketsContainingStock,
  getStockObservationLogs,
  type StockObservationLog,
} from "@/services/stocks";
import { User } from "@supabase/supabase-js";
import { ShoppingBasket, Plus, ClipboardList } from "lucide-react";
import { AddToBasketModal } from "./AddToBasketModal";
import { AddObservationLogModal } from "./AddObservationLogModal";

type Props = {
  code: string;
  user?: User;
};

// 数値フォーマット用ヘルパー
const fmt = (
  val: number | null | undefined,
  unit: string = "",
  fixed: number = 0,
) => {
  if (val === null || val === undefined) return "-";
  return (
    val.toLocaleString(undefined, {
      minimumFractionDigits: fixed,
      maximumFractionDigits: fixed,
    }) + unit
  );
};

// 大きな数値を「兆」「億」「万」で丸めるヘルパー
const fmtLarge = (
  val: number | null | undefined,
  unit: string = "",
  isMillionYen: boolean = false,
) => {
  if (val === null || val === undefined) return "-";

  let num = val;
  let suffix = unit;

  // 時価総額（百万円単位）の場合の特別処理
  if (isMillionYen) {
    num = val * 1000000;
    suffix = "円";
  }

  const abs = Math.abs(num);

  if (abs >= 1000000000000) {
    return (
      (num / 1000000000000).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      }) +
      "兆" +
      suffix
    );
  }
  if (abs >= 100000000) {
    return (
      (num / 100000000).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      }) +
      "億" +
      suffix
    );
  }
  if (abs >= 10000) {
    return (
      (num / 10000).toLocaleString(undefined, { maximumFractionDigits: 2 }) +
      "万" +
      suffix
    );
  }

  if (isMillionYen) {
    return val.toLocaleString() + "百万円";
  }

  return num.toLocaleString() + suffix;
};

// 日付フォーマット (MM/DD)
const fmtDate = (dateStr?: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
    .getDate()
    .toString()
    .padStart(2, "0")}`;
};

const InfoItem = ({
  label,
  value,
  date,
  subLabel,
}: {
  label: string;
  value: string;
  date?: string;
  subLabel?: string;
}) => (
  <div className="flex flex-col border-b border-slate-100 py-2 px-1 last:border-0 hover:bg-slate-50 transition-colors">
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
        {label}
        {subLabel && (
          <span className="block text-xs font-normal scale-90 origin-top-left text-slate-400">
            {subLabel}
          </span>
        )}
      </span>
      <div className="text-right">
        <span className="text-base font-semibold text-slate-800 block">
          {value}
        </span>
        {date && <span className="text-xs text-slate-400 block">({date})</span>}
      </div>
    </div>
  </div>
);

export default function StockDetailInfo({ code, user }: Props) {
  const [stockData, setStockData] = useState<StockDetails | null>(null);
  const [basicInfo, setBasicInfo] = useState<{
    name: string;
    market?: string;
    industry33?: string | null;
    industry17?: string | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBasketModalOpen, setIsBasketModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [containingBaskets, setContainingBaskets] = useState<
    { id: number; name: string }[]
  >([]);
  const [logs, setLogs] = useState<StockObservationLog[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setStockData(null); // リセット
      setBasicInfo(null);
      setError(null);
      try {
        const [data, jpxInfos] = await Promise.all([
          fetchStockDetails(code),
          getStockInfoJpxMaster([code]),
        ]);
        if (isMounted) {
          setStockData(data);
          if (jpxInfos && jpxInfos.length > 0) {
            setBasicInfo({
              name: jpxInfos[0].company_name,
              market: jpxInfos[0].market_segment,
              industry33: jpxInfos[0].industry_33_name,
              industry17: jpxInfos[0].industry_17_name,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch stock details", err);
        if (isMounted) {
          setError("株価情報の取得に失敗しました。");
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, [code]);

  // バスケット追加状況の確認
  const checkBaskets = async () => {
    if (user && code) {
      const baskets = await getBasketsContainingStock(user.id, code);
      setContainingBaskets(baskets);
    }
  };

  // 観察ログの取得
  const loadLogs = async () => {
    if (user && code) {
      const data = await getStockObservationLogs(user.id, code);
      setLogs(data);
    }
  };

  useEffect(() => {
    checkBaskets();
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, user]);

  const d = stockData;
  const date = d ? fmtDate(d.updated_at) : "";

  const data = {
    prevClose: { value: fmt(d?.prev_close), date },
    open: { value: fmt(d?.open), date },
    high: { value: fmt(d?.high), date },
    low: { value: fmt(d?.low), date },
    volume: { value: fmtLarge(d?.volume, "株"), date },
    marketCap: { value: fmtLarge(d?.market_cap, "", true), date },
    sharesIssued: { value: fmtLarge(d?.issued_shares, "株"), date },
    dividendYield: { value: fmt(d?.div_yield, "%", 2), date },
    dividendPerShare: { value: fmt(d?.dividend, "円", 2), date },
    per: { value: fmt(d?.per, "倍", 2), date },
    pbr: { value: fmt(d?.pbr, "倍", 2), date },
    eps: { value: fmt(d?.eps, "", 2), date },
    bps: { value: fmt(d?.bps, "", 2), date: "" },
    roe: { value: fmt(d?.roe, "%", 2), date: "" },
    equityRatio: { value: fmt(d?.equity_ratio, "%", 1), date: "" },
    minPurchasePrice: { value: fmt(d?.min_price), date },
    unitShares: { value: fmt(d?.unit_shares, "株"), date: "" },
    ytdHigh: { value: fmt(d?.high_price_ytd), date },
    ytdLow: { value: fmt(d?.low_price_ytd), date },
  };

  const isAdded = containingBaskets.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <div className="mb-4">
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-xl font-bold text-slate-800">
              {basicInfo?.name || "-"}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-600 tracking-wider">
                {code}
              </span>
              <span className="text-xs text-slate-500 border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded">
                {basicInfo?.market || "-"}
              </span>
              {basicInfo?.industry33 && basicInfo.industry33 !== "-" && (
                <span className="text-xs text-slate-500 border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded">
                  {basicInfo.industry33}
                </span>
              )}
              {basicInfo?.industry17 && basicInfo.industry17 !== "-" && (
                <span className="text-xs text-slate-500 border border-slate-200 bg-slate-50 px-1.5 py-0.5 rounded">
                  {basicInfo.industry17}
                </span>
              )}
            </div>
          </div>

          {user && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsLogModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 shrink-0"
                title="観察ログを追加"
              >
                <ClipboardList size={16} />
                <span className="hidden sm:inline">ログ記録</span>
              </button>
              <button
                onClick={() => setIsBasketModalOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border shrink-0 ${
                  isAdded
                    ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                    : "text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100"
                }`}
                title={
                  isAdded
                    ? `追加済み: ${containingBaskets
                        .map((b) => b.name)
                        .join(", ")}`
                    : "バスケットに追加"
                }
              >
                <ShoppingBasket
                  size={16}
                  className={isAdded ? "fill-emerald-700/20" : ""}
                />
                <span className="hidden sm:inline">
                  {isAdded ? "追加済み" : "バスケットへ"}
                </span>
                <Plus size={14} className="sm:hidden" />
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-700 mb-3 border-l-4 border-blue-500 pl-2 flex items-center gap-2">
        詳細情報
      </h3>

      {error ? (
        <div className="p-4 text-center text-red-500 bg-red-50 rounded-lg border border-red-100">
          <p className="font-bold">エラーが発生しました</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h4 className="text-base font-bold text-slate-500 mb-2 bg-slate-50 px-2 py-1 rounded inline-block">
              株価情報
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-1">
              <InfoItem
                label="前日終値"
                value={data.prevClose.value}
                date={data.prevClose.date}
              />
              <InfoItem
                label="始値"
                value={data.open.value}
                date={data.open.date}
              />
              <InfoItem
                label="高値"
                value={data.high.value}
                date={data.high.date}
              />
              <InfoItem
                label="安値"
                value={data.low.value}
                date={data.low.date}
              />
              <InfoItem
                label="出来高"
                value={data.volume.value}
                date={data.volume.date}
              />
            </div>
          </div>

          <div>
            <h4 className="text-base font-bold text-slate-500 mb-2 bg-slate-50 px-2 py-1 rounded inline-block">
              参考指標
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-1">
              <InfoItem
                label="時価総額"
                value={data.marketCap.value}
                date={data.marketCap.date}
              />
              <InfoItem
                label="発行済株式数"
                value={data.sharesIssued.value}
                date={data.sharesIssued.date}
              />
              <InfoItem label="単元株数" value={data.unitShares.value} />
              <InfoItem
                label="配当利回り"
                subLabel="（会社予想）"
                value={data.dividendYield.value}
                date={data.dividendYield.date}
              />
              <InfoItem
                label="1株配当"
                subLabel="（会社予想）"
                value={data.dividendPerShare.value}
                date={data.dividendPerShare.date}
              />
              <InfoItem
                label="PER"
                subLabel="（会社予想）"
                value={data.per.value}
                date={data.per.date}
              />
              <InfoItem
                label="PBR"
                subLabel="（実績）"
                value={data.pbr.value}
                date={data.pbr.date}
              />
              <InfoItem
                label="EPS"
                subLabel="（会社予想）"
                value={data.eps.value}
                date={data.eps.date}
              />
              <InfoItem
                label="BPS"
                subLabel="（実績）"
                value={data.bps.value}
              />
              <InfoItem
                label="ROE"
                subLabel="（実績）"
                value={data.roe.value}
              />
              <InfoItem
                label="自己資本比率"
                subLabel="（実績）"
                value={data.equityRatio.value}
              />
              <InfoItem
                label="最低購入代金"
                value={data.minPurchasePrice.value}
                date={data.minPurchasePrice.date}
              />
              <InfoItem
                label="年初来高値"
                value={data.ytdHigh.value}
                date={data.ytdHigh.date}
              />
              <InfoItem
                label="年初来安値"
                value={data.ytdLow.value}
                date={data.ytdLow.date}
              />
            </div>
          </div>

          {logs.length > 0 && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <h4 className="text-base font-bold text-slate-500 mb-3 bg-slate-50 px-2 py-1 rounded inline-block">
                観察ログ
              </h4>
              <div className="space-y-3">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-50 p-3 rounded-lg border border-slate-100"
                  >
                    <div className="text-xs text-slate-400 mb-1">
                      {fmtDate(log.date)}
                    </div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap">
                      {log.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <AddToBasketModal
        isOpen={isBasketModalOpen}
        onClose={() => {
          setIsBasketModalOpen(false);
          checkBaskets(); // モーダルが閉じたら状態を再確認
        }}
        userId={user?.id}
        stockCode={code}
        stockName={basicInfo?.name}
      />

      <AddObservationLogModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          loadLogs(); // モーダルが閉じたらログを再読み込み
        }}
        userId={user?.id}
        stockCode={code}
        stockName={basicInfo?.name}
      />
    </div>
  );
}
