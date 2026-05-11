import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Speech Adventure - ผจญภัยฝึกการพูด",
  description: "แอปฝึกการพูดสำหรับเด็ก สนุก เพลิดเพลิน พร้อมระบบประเมินผล AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg text-text">
        {children}
      </body>
    </html>
  );
}
