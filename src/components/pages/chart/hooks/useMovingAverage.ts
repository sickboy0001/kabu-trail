import { useEffect, useRef } from "react";
import {
  IChartApi,
  ISeriesApi,
  LineSeries,
  UTCTimestamp,
} from "lightweight-charts";

interface ChartData {
  time: UTCTimestamp;
  close: number;
}

export const useMovingAverage = (
  chart: IChartApi | null,
  data: ChartData[],
  visible: boolean,
) => {
  const ma5SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma25SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ma75SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  // シリーズの初期化
  useEffect(() => {
    if (!chart) return;

    ma5SeriesRef.current = chart.addSeries(LineSeries, {
      color: "#9C27B0",
      lineWidth: 1,
      title: "MA5",
      visible,
    });
    ma25SeriesRef.current = chart.addSeries(LineSeries, {
      color: "#2962FF",
      lineWidth: 1,
      title: "MA25",
      visible,
    });
    ma75SeriesRef.current = chart.addSeries(LineSeries, {
      color: "#FF6D00",
      lineWidth: 1,
      title: "MA75",
      visible,
    });
  }, [chart]);

  // データの計算と更新
  useEffect(() => {
    if (
      !data.length ||
      !ma5SeriesRef.current ||
      !ma25SeriesRef.current ||
      !ma75SeriesRef.current
    )
      return;

    const calculateSMA = (data: ChartData[], count: number) => {
      const result = [];
      for (let i = 0; i < data.length; i++) {
        if (i < count - 1) continue;
        let sum = 0;
        for (let j = 0; j < count; j++) {
          sum += data[i - j].close;
        }
        result.push({ time: data[i].time, value: sum / count });
      }
      return result;
    };

    ma5SeriesRef.current.setData(calculateSMA(data, 5));
    ma25SeriesRef.current.setData(calculateSMA(data, 25));
    ma75SeriesRef.current.setData(calculateSMA(data, 75));
  }, [data]);

  // 表示切り替え
  useEffect(() => {
    ma5SeriesRef.current?.applyOptions({ visible });
    ma25SeriesRef.current?.applyOptions({ visible });
    ma75SeriesRef.current?.applyOptions({ visible });
  }, [visible]);

  return { ma5SeriesRef, ma25SeriesRef, ma75SeriesRef };
};
