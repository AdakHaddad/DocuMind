import type { Metadata } from "next";
import "./globals.css";

import { Inter, Open_Sans } from "next/font/google";

export const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
export const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans"
});

export const metadata: Metadata = {
  title: "DocuMind",
  description: "DocuMind - Platform Pembelajaran Efisien"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`h-screen overflow-clip flex flex-col`}>
        <div className="flex items-center justify-center bg-documind-primary py-[.5vw] mb-[2vw] shadow-[-3px_6px_4px_0px_rgba(0,0,0,0.3)]">
          <p className="text-[3vw] font-inter">{`<header>`}</p>
        </div>
        <div className="flex grow bg-documind-bg">{children}</div>
        <div className="flex items-center justify-center bg-documind-primary py-[.5vw] mt-[2vw] shadow-[-3px_-6px_4px_0px_rgba(0,0,0,0.3)]">
          <p className="text-[3vw] font-inter">{`<footer>`}</p>
        </div>
      </body>
    </html>
  );
}
