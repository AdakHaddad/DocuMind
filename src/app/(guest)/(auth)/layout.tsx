"use client";

import Header from "@/src/components/Header";
import ModalTemplate from "@/src/components/ModalTemplate";
import { main } from "@/src/utils/routes";
import { useRouter } from "next/navigation";

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  return (
    <>
      <Header>
        <ModalTemplate
          content={
            <button
              className="text-xl font-bold font-inter w-fit h-fit cursor-pointer outline-none"
              onClick={() => router.push(main)}
            >
              <span className="text-documind-text-primary">Docu</span>
              <span className="text-documind-primary">Mind</span>
            </button>
          }
          containerClass="w-fit rounded-[.4vw] px-[.6vw] leading-none py-[.2vw] bg-documind-bg"
        />
      </Header>
      {children}
    </>
  );
}
