import TradeHistoryClient from "@/components/pages/user/_tradeHistory/TradeHistoryClient";
import { createKabuTrailServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
export default async function page() {
  const supabaseServer = await createKabuTrailServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  // セッションがない場合はログインへリダイレクト
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-4 w-full">
      <TradeHistoryClient user={user}></TradeHistoryClient>
    </div>
  );
}
