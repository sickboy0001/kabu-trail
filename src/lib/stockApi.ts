"use server";
// 1. まずはデフォルトインポートで全体を取得
import YahooFinance from "yahoo-finance2";

// インスタンスを作成
const yahooFinance = new YahooFinance();

export interface YahooFinanceApiResponse {
  chart: {
    result: Array<{
      meta: {
        currency: string;
        symbol: string;
        regularMarketPrice: number;
        fiftyTwoWeekHigh: number;
        fiftyTwoWeekLow: number;
        regularMarketDayHigh: number;
        regularMarketDayLow: number;
        regularMarketVolume: number;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }>;
      };
    }>;
    error: null | any;
  };
}

export interface StockDetails {
  market_cap: number | null;
  issued_shares: number | null;
  div_yield: number | null;
  dividend: number | null;
  per: number | null;
  pbr: number | null;
  eps: number | null;
  bps: number | null;
  roe: number | null;
  equity_ratio: number | null;
  min_price: number | null;
  unit_shares: number | null;
  high_price_ytd: number | null;
  low_price_ytd: number | null;
  prev_close: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  updated_at: string;
}
//http://localhost:3000/test/stockdetailでテスト可能

export async function FetchStockData(
  symbol: string,
  startDate: string,
  endDate: string,
  interval: "1d" | "1wk" | "1mo" = "1d"
): Promise<YahooFinanceApiResponse> {
  const baseUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
  const queryParams = new URLSearchParams({
    period1: Math.floor(new Date(startDate).getTime() / 1000).toString(),
    period2: Math.floor(new Date(endDate).getTime() / 1000).toString(),
    interval: interval,
    events: "history",
    includeAdjustedClose: "true",
  });

  const url = `${baseUrl}?${queryParams.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Yahoo Finance API Error:", errorData);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    const data: YahooFinanceApiResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch stock data from Yahoo Finance:", error);
    throw error;
  }
}
export async function fetchStockDetails(
  symbol: string
): Promise<StockDetails | null> {
  const currentSymbol = symbol.includes(".") ? symbol : `${symbol}.T`;

  try {
    console.log(`[fetchStockDetails] Fetching: ${currentSymbol}`);

    // インスタンスから直接呼び出す
    const summary = await yahooFinance.quoteSummary(currentSymbol, {
      modules: [
        "defaultKeyStatistics",
        "financialData",
        "summaryDetail",
        "price",
      ],
    });

    if (!summary) return null;

    const { defaultKeyStatistics, financialData, summaryDetail, price } =
      summary;

    return {
      market_cap: summaryDetail?.marketCap
        ? Math.round(summaryDetail.marketCap / 1_000_000)
        : null,
      issued_shares: defaultKeyStatistics?.sharesOutstanding ?? null,
      div_yield: summaryDetail?.dividendYield
        ? summaryDetail.dividendYield * 100
        : null,
      dividend: summaryDetail?.dividendRate ?? null,
      per: summaryDetail?.trailingPE ?? null,
      pbr: defaultKeyStatistics?.priceToBook ?? null,
      eps: defaultKeyStatistics?.trailingEps ?? null,
      bps: defaultKeyStatistics?.bookValue ?? null,
      roe: financialData?.returnOnEquity
        ? financialData.returnOnEquity * 100
        : null,
      equity_ratio: financialData?.quickRatio ?? null,
      min_price: price?.regularMarketPrice
        ? price.regularMarketPrice * 100
        : null,
      unit_shares: 100,
      high_price_ytd: summaryDetail?.fiftyTwoWeekHigh
        ? Math.round(summaryDetail.fiftyTwoWeekHigh)
        : null,
      low_price_ytd: summaryDetail?.fiftyTwoWeekLow
        ? Math.round(summaryDetail.fiftyTwoWeekLow)
        : null,
      prev_close:
        summaryDetail?.previousClose ??
        price?.regularMarketPreviousClose ??
        null,
      open: summaryDetail?.open ?? price?.regularMarketOpen ?? null,
      high: summaryDetail?.dayHigh ?? price?.regularMarketDayHigh ?? null,
      low: summaryDetail?.dayLow ?? price?.regularMarketDayLow ?? null,
      volume: summaryDetail?.volume ?? price?.regularMarketVolume ?? null,
      updated_at: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error(`[fetchStockDetails] Error:`, error.message);
    return null;
  }
}
