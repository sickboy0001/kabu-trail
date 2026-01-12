import { createKabuTrailServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
// import { getAccountListDisplayData } from "@/services/account-server";
import PerformanceClient from "@/components/pages/user/performance/PerformanceClient";

export default async function AccountPage() {
  const supabaseServer = await createKabuTrailServerClient();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  // セッションがない場合はログインへリダイレクト
  if (!user) {
    redirect("/login");
  }

  // const { brokers, accounts } = await getAccountListDisplayData(
  //   supabaseServer,
  //   user.id
  // );

  return (
    <div>
      <PerformanceClient user={user}></PerformanceClient>
    </div>
  );
}
