import StockChart from "@/components/pages/chart/StockChart";
import UserStockClient from "@/components/pages/user/stock/UserStockClient";
import { createKabuTrailServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createKabuTrailServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // セッションがない場合はログインへリダイレクト
  if (!user) {
    redirect("/login");
  }
  // return <StockChart user={user} />;
  const code = "";
  return <UserStockClient user={user} initialCode={code} />;
}
