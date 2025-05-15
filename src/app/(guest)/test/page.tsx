"use client";

import RegeneratePromptModal from "@/src/components/RegeneratePromptModal";
import React from "react";

const Test = () => {
  return (
    <div className="flex flex-col w-full h-full items-center justify-center relative overflow-clip">
      <RegeneratePromptModal />
      <h1>Lorem Ipsum</h1>
    </div>
  );
};

export default Test;
