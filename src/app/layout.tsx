import type { Metadata } from "next";
import "./globals.css";

import { Inter, Open_Sans } from "next/font/google";
import Providers from "../components/Providers";

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
      <body
        className={`h-screen overflow-clip flex flex-col py-[5vh] justify-center`}
      >
        <Providers>
          <div className="flex grow max-h-[80vh] overflow-clip bg-documind-bg">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
