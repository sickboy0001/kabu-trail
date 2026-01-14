import StockChart from "@/components/pages/chart/StockChart";
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

  return <StockChart />;
}
