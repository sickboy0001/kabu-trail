import AssetHistoryClient from "@/components/pages/user/assets/AssetHistoryClient";
import { createKabuTrailServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

export default async function AssetsHistory() {
  const supabase = await createKabuTrailServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // セッションがない場合はログインへリダイレクト
  if (!user) {
    redirect("/login");
  }

  return <AssetHistoryClient user={user} />;
}
