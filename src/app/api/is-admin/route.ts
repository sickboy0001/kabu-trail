import { NextResponse } from "next/server";
import { createKabuTrailServerClient } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  try {
    const supabase = await createKabuTrailServerClient();
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    // Use admin client to avoid RLS restrictions and add debug logs
    const { createKabuTrailAdminClient } = await import("@/lib/supabaseAdmin");
    const admin = createKabuTrailAdminClient();

    console.log("is-admin: checking roles for user:", user.id);

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn(
        "is-admin: SUPABASE_SERVICE_ROLE_KEY is missing. Admin client may lack permissions."
      );
    }

    let { data, error } = await admin
      .from("user_roles")
      .select(`role_id, roles(name)`)
      .eq("user_id", user.id);

    if (error && error.code === "42501") {
      console.warn(
        "is-admin: Admin permission denied (42501). Falling back to user client."
      );
      const res = await supabase
        .from("user_roles")
        .select(`role_id, roles(name)`)
        .eq("user_id", user.id);
      data = res.data;
      error = res.error;
    }

    console.log("is-admin: query result", { data, error });

    if (error) {
      console.error("is-admin admin query error:", error);
      return NextResponse.json({ isAdmin: false }, { status: 200 });
    }

    const roleNames = (data || [])
      .map((r: any) => r.roles?.name)
      .filter(Boolean);
    const isAdmin = roleNames.some((n: string) => /admin/i.test(n));

    console.log("is-admin: roleNames=", roleNames, "isAdmin=", isAdmin);

    return NextResponse.json({ isAdmin }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ isAdmin: false }, { status: 500 });
  }
}
