import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 関数名は必ず「middleware」である必要があります
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. ログインしていない 且つ
  // 2. アクセス先が /dashboard など「保護されたパス」である場合のみリダイレクト
  const protectedPaths = [
    "/dashboard",
    "/trades",
    "/analytics",
    "/settings",
    "/calendar",
  ];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!user && isProtectedPath) {
    // ログインしていない場合は、ログイン画面ではなく「マーケット概況(トップ)」に飛ばすのもアリです
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 既にログインしているのに /login や / にアクセスした場合は /dashboard へ（オプション）
  if (
    user &&
    (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
