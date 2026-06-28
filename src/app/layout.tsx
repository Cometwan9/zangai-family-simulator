import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "葬AI家族模拟器",
  description: "重返2009，复兴葬爱家族。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
