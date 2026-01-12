import { createKabuTrailServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
// import { getAccountListDisplayData } from "@/services/account-server";
import PositionsClient from "@/components/pages/user/positions/PositionsClient";

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
    <div className="p-4 w-full">
      <PositionsClient user={user}></PositionsClient>
    </div>
  );
}
