import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "V-Dash — Multi-Channel Team Collaboration",
  description:
    "다수의 채널을 운영하는 콘텐츠 팀을 위한 제작 관리 시스템. 기획-촬영-업로드-분석 워크플로우를 AI 에이전트가 자동화합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
