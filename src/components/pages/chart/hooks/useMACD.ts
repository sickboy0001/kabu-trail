import { useEffect, useRef } from "react";
import {
  IChartApi,
  ISeriesApi,
  LineSeries,
  HistogramSeries,
  UTCTimestamp,
} from "lightweight-charts";

interface ChartData {
  time: UTCTimestamp;
  close: number;
}

export const useMACD = (
  chart: IChartApi | null,
  volumeSeries: ISeriesApi<"Histogram"> | null,
  data: ChartData[],
  visible: boolean,
) => {
  const macdSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const signalSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdHistSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // シリーズの初期化
  useEffect(() => {
    if (!chart) return;

    macdSeriesRef.current = chart.addSeries(LineSeries, {
      color: "#2962FF",
      lineWidth: 1,
      title: "MACD",
      priceScaleId: "macd",
      visible,
    });
    signalSeriesRef.current = chart.addSeries(LineSeries, {
      color: "#FF6D00",
      lineWidth: 1,
      title: "Signal",
      priceScaleId: "macd",
      visible,
    });
    macdHistSeriesRef.current = chart.addSeries(HistogramSeries, {
      color: "#26a69a",
      priceScaleId: "macd",
      visible,
    });
  }, [chart]);

  // データの計算と更新
  useEffect(() => {
    if (
      !data.length ||
      !macdSeriesRef.current ||
      !signalSeriesRef.current ||
      !macdHistSeriesRef.current
    )
      return;

    const calculateEMA = (values: number[], period: number) => {
      const k = 2 / (period + 1);
      const emaArray = new Array(values.length).fill(0);
      let sum = 0;
      for (let i = 0; i < period; i++) sum += values[i];
      emaArray[period - 1] = sum / period;
      for (let i = period; i < values.length; i++) {
        emaArray[i] = values[i] * k + emaArray[i - 1] * (1 - k);
      }
      return emaArray;
    };

    const closePrices = data.map((d) => d.close);
    const ema12 = calculateEMA(closePrices, 12);
    const ema26 = calculateEMA(closePrices, 26);

    const macdLine = [];
    const macdValues = [];
    for (let i = 0; i < data.length; i++) {
      if (i < 25) {
        macdValues.push(0);
        continue;
      }
      const val = ema12[i] - ema26[i];
      macdLine.push({ time: data[i].time, value: val });
      macdValues.push(val);
    }

    const signalValues = calculateEMA(macdValues, 9);
    const signalLine = [];
    const histogram = [];

    for (let i = 0; i < data.length; i++) {
      if (i < 25 + 8) continue;
      signalLine.push({ time: data[i].time, value: signalValues[i] });
      histogram.push({
        time: data[i].time,
        value: macdValues[i] - signalValues[i],
        color: macdValues[i] - signalValues[i] >= 0 ? "#26a69a" : "#ef5350",
      });
    }

    macdSeriesRef.current.setData(macdLine);
    signalSeriesRef.current.setData(signalLine);
    macdHistSeriesRef.current.setData(histogram);
  }, [data]);

  // レイアウト調整と表示切り替え
  useEffect(() => {
    macdSeriesRef.current?.applyOptions({ visible });
    signalSeriesRef.current?.applyOptions({ visible });
    macdHistSeriesRef.current?.applyOptions({ visible });

    if (chart) {
      if (visible) {
        chart.priceScale("right").applyOptions({
          scaleMargins: { top: 0.05, bottom: 0.45 },
        });
        if (volumeSeries) {
          volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.6, bottom: 0.25 },
          });
        }
        chart.priceScale("macd").applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        });
      } else {
        chart.priceScale("right").applyOptions({
          scaleMargins: { top: 0.1, bottom: 0.3 },
        });
        if (volumeSeries) {
          volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
          });
        }
      }
    }
  }, [visible, chart, volumeSeries]);

  return { macdSeriesRef, signalSeriesRef, macdHistSeriesRef };
};
