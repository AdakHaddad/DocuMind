"use client";

import ReportQuestionModal from "@/src/components/ReportQuestionModal";
import React from "react";

const Test = () => {
  return (
    <div className="flex flex-col w-full h-full items-center justify-center relative overflow-clip">
      <ReportQuestionModal question="1. Hi, what's up!" />
      <h1>Lorem Ipsum</h1>
    </div>
  );
};

export default Test;
