"use client";

import Footer from "@/src/components/Footer";
import ModalTemplate from "@/src/components/modals/ModalTemplate";
import { flashcards, quiz } from "@/src/utils/routes";
import { usePathname, useRouter } from "next/navigation";

export default function InsideFooter() {
  const router = useRouter();
  const pathname = usePathname();

  type Navigation = {
    title: string;
    route: string[];
  };
  const navigations: Navigation[] = [
    {
      title: "Overview",
      route: ["*"]
    },
    {
      title: "Flashcards",
      route: [flashcards]
    },
    {
      title: "Quiz",
      route: [quiz]
    }
  ];

  return (
    <Footer>
      <div className="flex gap-4 py-1">
        {navigations.map((nav, index) => (
          <ModalTemplate
            key={index}
            content={
              <button
                className="text-xl py-1 font-bold font-inter w-fit h-fit outline-none cursor-pointer"
                onClick={() => router.push(nav.route[0])}
              >
                <span className="text-documind-text-primary">{nav.title}</span>
              </button>
            }
            containerClass={
              "w-fit rounded-[.4vw] px-[.6vw] leading-none py-[.2vw] " +
              (nav.route.includes(pathname) || nav.route.includes("*")
                ? "bg-documind-secondary"
                : "bg-documind-bg hover:bg-gray-200")
            }
          />
        ))}
      </div>
    </Footer>
  );
}
