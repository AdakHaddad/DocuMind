"use client";

import MainFooter from "@/src/components/MainFooter";
// import { useSession } from "next-auth/react";

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  // const { data: session } = useSession(); // Using useSession hook to get the session data

  // // Log the session data to the console
  // console.log("User session:", session);

  return (
    <div className="flex flex-col items-center justify-center bg-white text-black h-full w-full">
      {children}
      <MainFooter />
    </div>
  );
}
