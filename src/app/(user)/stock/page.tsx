import UserStockClient from "@/components/pages/user/stock/UserStockClient";
import { createKabuTrailServerClient } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const supabase = await createKabuTrailServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // セッションがない場合はログインへリダイレクト
  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : undefined;
  console.log("Stock code:", code);
  return <UserStockClient user={user} initialCode={code} />;
}
