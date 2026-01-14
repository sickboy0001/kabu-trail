"use client";

import React, { useEffect, useState } from "react";
import { fetchStockDetails, type StockDetails } from "@/lib/stockApi";

type Props = {
  code: string;
};

// 数値フォーマット用ヘルパー
const fmt = (
  val: number | null | undefined,
  unit: string = "",
  fixed: number = 0
) => {
  if (val === null || val === undefined) return "-";
  return (
    val.toLocaleString(undefined, {
      minimumFractionDigits: fixed,
      maximumFractionDigits: fixed,
    }) + unit
  );
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

export default function StockDetailInfo({ code }: Props) {
  const [stockData, setStockData] = useState<StockDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setStockData(null); // リセット
      setError(null);
      try {
        const data = await fetchStockDetails(code);
        if (isMounted) {
          setStockData(data);
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

  const d = stockData;
  const date = d ? fmtDate(d.updated_at) : "";

  const data = {
    prevClose: { value: fmt(d?.prev_close), date },
    open: { value: fmt(d?.open), date },
    high: { value: fmt(d?.high), date },
    low: { value: fmt(d?.low), date },
    volume: { value: fmt(d?.volume, "株"), date },
    marketCap: { value: fmt(d?.market_cap, "百万円"), date },
    sharesIssued: { value: fmt(d?.issued_shares, "株"), date },
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
      <h3 className="text-lg font-bold text-slate-700 mb-3 border-l-4 border-blue-500 pl-2 flex items-center gap-2">
        詳細情報
        <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
          Code: {code}
        </span>
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
        </>
      )}
    </div>
  );
}
