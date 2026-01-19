import { createKabuTrailServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import HoldingsClient from "@/components/pages/user/holdings/HoldingsClient";

export default async function AccountPage() {
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
      <HoldingsClient user={user}></HoldingsClient>
    </div>
  );
}
