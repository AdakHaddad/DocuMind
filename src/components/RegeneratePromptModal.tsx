"use client";

import React, { useState } from "react";

const RegeneratePromptModal = () => {
  const [prompt, setPrompt] = useState("");

  const handleRegenerate = () => {
    // Logic to handle the regeneration with the prompt
    console.log("Regenerating with prompt:", prompt);
    // Clear the input after regeneration
    setPrompt("");
  };

  return (
    <div className="flex items-center justify-center w-full h-full bg-black/40 z-[1] fixed top-0 left-0">
      <div className="bg-white rounded-lg border-2 border-blue-400 w-[400px] p-4 shadow-xl flex flex-col items-center justify-center">
        {/* Header */}
        <div className="text-center font-semibold text-blue-700 mb-4">
          Regenerate Prompt
        </div>

        {/* Text Area for Prompt */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Give your detailed regenerate prompt if exist, or just leave this empty"
          className="w-full h-24 p-2 border border-gray-300 rounded-md focus:outline-none mb-4"
        />

        {/* Regenerate Button */}
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          onClick={handleRegenerate}
        >
          Regenerate
        </button>
      </div>
    </div>
  );
};

export default RegeneratePromptModal;
