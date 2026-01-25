import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";

export type MarketCalendarRow = {
  date: string;
  is_open: boolean;
};

export const useMarketCalendar = () => {
  const [calendarData, setCalendarData] = useState<MarketCalendarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const today = new Date();
        // 過去30日分取得（直近の営業日を確実に見つけるため）
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);

        const { data, error } = await supabase
          .from("market_calendar")
          .select("date, is_open")
          .lte("date", today.toISOString().split("T")[0]) // 今日以前
          .gte("date", startDate.toISOString().split("T")[0])
          .order("date", { ascending: false });

        if (error) {
          console.error("Error fetching market calendar:", error);
        } else {
          setCalendarData(data || []);
        }
      } catch (err) {
        console.error("Unexpected error fetching calendar:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCalendar();
  }, []);

  const getBusinessDates = useCallback(() => {
    // 営業日のみ抽出
    const businessDays = calendarData.filter((d) => d.is_open);

    // 最新の営業日（今日以前で最大の日付）
    const latest = businessDays.length > 0 ? businessDays[0].date : null;
    // その前の営業日
    const previous = businessDays.length > 1 ? businessDays[1].date : null;

    return { latest, previous };
  }, [calendarData]);

  return { loading, getBusinessDates };
};
