"use client";

import { ReactNode } from "react";

export default function Header({ children }: { children: ReactNode }) {
  return (
    <header className="sticky top-0 z-50 bg-[#4a90e2] text-white shadow-md">
      {children}
    </header>
  );
}
