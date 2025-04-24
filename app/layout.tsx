import type { Metadata } from "next";
import "./globals.css";

import { Inter, Open_Sans } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
      <body className={`h-screen overflow-clip flex flex-col py-[5vh]`}>
        <Header />
        <div className="flex grow overflow-clip bg-documind-bg">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
