"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  UTCTimestamp,
} from "lightweight-charts";
import { FetchStockData } from "@/lib/stockApi";

type Props = {
  code: string;
};

export default function StockChart({ code }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [interval, setInterval] = useState<"1d" | "1wk" | "1mo">("1d");

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 1. チャートの初期化
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#334155", // slate-700
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      grid: {
        vertLines: { color: "#e2e8f0" }, // slate-200
        horzLines: { color: "#e2e8f0" },
      },
    });

    // 2. シリーズ（データの種類）の追加：ローソク足
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a", // 上昇（緑）
      downColor: "#ef5350", // 下落（赤）
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    // 出来高（ヒストグラム）を追加
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "", // オーバーレイとして設定
    });

    // レイアウト調整：ローソク足を上部に、出来高を下部に表示
    chart.priceScale("right").applyOptions({
      scaleMargins: {
        top: 0.1,
        bottom: 0.3, // 下部30%を空ける
      },
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8, // 上部80%を空ける（下部20%を使用）
        bottom: 0,
      },
    });

    // ツールチップの作成
    const toolTip = document.createElement("div");
    toolTip.style.width = "auto";
    toolTip.style.height = "auto";
    toolTip.style.position = "absolute";
    toolTip.style.display = "none";
    toolTip.style.padding = "8px";
    toolTip.style.boxSizing = "border-box";
    toolTip.style.fontSize = "12px";
    toolTip.style.textAlign = "left";
    toolTip.style.zIndex = "1000";
    toolTip.style.top = "12px";
    toolTip.style.left = "12px";
    toolTip.style.pointerEvents = "none";
    toolTip.style.border = "1px solid #e2e8f0";
    toolTip.style.borderRadius = "4px";
    toolTip.style.background = "rgba(255, 255, 255, 0.9)";
    toolTip.style.color = "#334155";
    toolTip.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)";
    toolTip.style.fontFamily =
      "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif";

    chartContainerRef.current.appendChild(toolTip);
    chartContainerRef.current.style.position = "relative";

    chart.subscribeCrosshairMove((param) => {
      if (
        !chartContainerRef.current ||
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current.clientHeight
      ) {
        toolTip.style.display = "none";
      } else {
        const dateStr = new Date(
          (param.time as number) * 1000
        ).toLocaleDateString();
        const candleData = param.seriesData.get(candlestickSeries) as
          | { open: number; high: number; low: number; close: number }
          | undefined;
        const volumeData = param.seriesData.get(volumeSeries) as
          | { value: number }
          | undefined;

        if (candleData) {
          const high = candleData.high.toFixed(1);
          const low = candleData.low.toFixed(1);
          const volume = volumeData ? volumeData.value.toLocaleString() : "N/A";

          toolTip.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">${dateStr}</div>
            <div>高値: ${high}</div>
            <div>安値: ${low}</div>
            <div>出来高: ${volume}</div>
          `;

          const toolTipWidth = toolTip.offsetWidth;
          const toolTipHeight = toolTip.offsetHeight;
          const margin = 15;

          let left = param.point.x + margin;
          if (left > chartContainerRef.current.clientWidth - toolTipWidth) {
            left = param.point.x - margin - toolTipWidth;
          }

          let top = param.point.y + margin;
          if (top > chartContainerRef.current.clientHeight - toolTipHeight) {
            top = param.point.y - toolTipHeight - margin;
          }

          toolTip.style.left = `${left}px`;
          toolTip.style.top = `${top}px`;
          toolTip.style.display = "block";
        }
      }
    });

    // 3. データ取得と設定
    const loadData = async () => {
      try {
        // 期間設定
        const endDate = new Date();
        const startDate = new Date();

        if (interval === "1mo") {
          startDate.setFullYear(endDate.getFullYear() - 5);
        } else if (interval === "1wk") {
          startDate.setFullYear(endDate.getFullYear() - 2);
        } else {
          startDate.setFullYear(endDate.getFullYear() - 1);
        }

        // API呼び出し用にコードを調整（.Tがない場合は付与）
        const symbol = code.endsWith(".T") ? code : `${code}.T`;

        // APIからデータ取得 (例: トヨタ自動車 7203.T)
        const data = await FetchStockData(
          symbol,
          startDate.toISOString(),
          endDate.toISOString(),
          interval
        );

        const result = data.chart.result[0];
        if (!result) return;

        const { timestamp, indicators } = result;
        const quote = indicators.quote[0] as {
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        };

        // APIレスポンスをチャート用データに変換
        const validData = timestamp
          .map((t, i) => ({
            time: t as UTCTimestamp, // Unix Timestamp
            open: quote.open[i],
            high: quote.high[i],
            low: quote.low[i],
            close: quote.close[i],
            volume: quote.volume[i],
          }))
          .filter(
            (
              item
            ): item is {
              time: UTCTimestamp;
              open: number;
              high: number;
              low: number;
              close: number;
              volume: number;
            } =>
              item.open != null &&
              item.high != null &&
              item.low != null &&
              item.close != null &&
              item.volume != null
          ); // nullデータを除外

        candlestickSeries.setData(
          validData.map((d) => ({
            time: d.time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }))
        );
        volumeSeries.setData(
          validData.map((d) => ({
            time: d.time,
            value: d.volume,
            color: d.close >= d.open ? "#26a69a" : "#ef5350", // 上昇は緑、下落は赤
          }))
        );
      } catch (error) {
        console.error("Chart data loading error:", error);
      }
    };

    loadData();

    // 4. ウィンドウリサイズへの対応
    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    // 5. クリーンアップ
    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      if (toolTip.parentNode) {
        toolTip.parentNode.removeChild(toolTip);
      }
    };
  }, [code, interval]);

  return (
    <div className="w-full bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex justify-end gap-2 mb-2">
        <button
          onClick={() => setInterval("1d")}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            interval === "1d"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          日足
        </button>
        <button
          onClick={() => setInterval("1wk")}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            interval === "1wk"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          週足
        </button>
        <button
          onClick={() => setInterval("1mo")}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            interval === "1mo"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          月足
        </button>
      </div>
      <div ref={chartContainerRef} />
    </div>
  );
}
