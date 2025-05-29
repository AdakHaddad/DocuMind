"use client";

import Questions from "@/src/components/pages/Questions";
import React from "react";

const QuestionsPage = () => {
  return (
    <div className="flex flex-col w-full max-h-screen items-center justify-center relative">
      <Questions />
    </div>
  );
};

export default QuestionsPage;
