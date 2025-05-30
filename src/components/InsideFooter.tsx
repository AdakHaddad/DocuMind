"use client";

import Footer from "@/src/components/Footer";
import ModalTemplate from "@/src/components/modals/ModalTemplate";
import { usePathname, useRouter } from "next/navigation";
import { DocumentObject } from "../app/[user]/page";

export default function InsideFooter({
  document
}: {
  document: DocumentObject;
}) {
  const router = useRouter();
  const pathname = usePathname();

  type Navigation = {
    title: string;
    route: string[];
  };
  const navigations: Navigation[] = [
    {
      title: "Overview",
      route: [`/${document.owner}/${document.slug}`]
    },
    {
      title: "Flashcards",
      route: [`/${document.owner}/${document.slug}/flashcards`]
    },
    {
      title: "Quiz",
      route: [`/${document.owner}/${document.slug}/questions`]
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
