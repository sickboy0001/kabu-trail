import "./globals.css";
import Navbar from "@/components/layout/Navbar";

export const metadata = {
  title: "KabuTrail - 株の一元管理",
  description: "個人投資家のための損益管理アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
