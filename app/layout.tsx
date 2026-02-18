import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Serif_SC } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const serif = Noto_Serif_SC({
  weight: ["300", "400", "600"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap"
});

const mono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "PromptLib",
  description: "极简社论风提示词管理库。"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className={`${serif.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
