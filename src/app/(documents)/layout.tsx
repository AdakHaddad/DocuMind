"use client";

import Header from "@/src/components/Header";
import InsideFooter from "@/src/components/InsideFooter";
import { dashboard } from "@/src/utils/routes";
import Link from "next/link";

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col items-center justify-center bg-white text-black h-full w-full">
      {/* Header */}
      <Header>
        <div className="flex gap-6 py-2">
          {/* Back & Doc Name */}
          <div className="flex gap-6 justify-center items-left">
            <Link
              href={dashboard}
              className="border-2 border-[#F5A623] bg-[#F5A623] text-white font-bold px-4 py-3 rounded-md hover:bg-gray-400 hover:border-gray-400 transition-colors">
              {`<<`}
            </Link>
            <div className="bg-white rounded-md px-6 py-2 shadow-md">
              <h1 className="text-3xl font-bold">
                <span className="text-gray-800">
                  Modul 1 - Rumusan Masalah.pdf
                </span>
              </h1>
            </div>
          </div>
          {/* Rename Delete */}
          <div className="flex gap-4 justify-right items-right">
            <button className="border-2 border-white bg-transparent text-white px-6 py-3 rounded-md font-medium hover:bg-gray-400 hover:border-gray-400 hover:text-white cursor-pointer transition-colors shadow-md">
              Rename
            </button>
            <button className="border-2 border-[#F5A623] bg-[#F5A623] text-white font-bold px-4 py-3 rounded-md hover:bg-gray-400 hover:border-gray-400 cursor-pointer transition-colors">
              Delete
            </button>
          </div>
        </div>
      </Header>
      {children}
      <InsideFooter />
    </div>
  );
}
