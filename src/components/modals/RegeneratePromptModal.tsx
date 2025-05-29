"use client";

import React, { useState } from "react";

interface IRegeneratePromptModal {
  documentId: string;
  onClose: () => void;
  type: "flashcards" | "quizes";
}

const RegeneratePromptModal: React.FC<IRegeneratePromptModal> = ({
  documentId,
  onClose,
  type
}) => {
  const [prompt, setPrompt] = useState("");

  const handleRegenerate = async () => {
    // Logic to handle the regeneration with the prompt
    try {
      const endpoint = "/api/learning/" + (type as string); // Adjust endpoint as needed

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          documentId: documentId,
          count: type === "flashcards" ? 12 : 10,
          regeneratePrompt: prompt
        })
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate prompt");
      }

      const data = await response.json();
      console.log("Regeneration successful:", data);

      // Refresh the page
      window.location.reload();
    } catch (error) {
      console.error("Error during regeneration:", error);
      alert("Failed to regenerate prompt. Please try again later.");
    }

    // Clear the input after regeneration
    setPrompt("");
    // Close the modal
    onClose();
  };

  return (
    <div className="flex items-center justify-center w-full h-full bg-black/40 z-[1] fixed top-0 left-0">
      <div className="bg-white rounded-lg border-4 border-blue-400 w-[600px] h-max-[75%] p-4 shadow-xl flex flex-col items-center justify-center">
        {/* Header */}
        <div className="text-center text-documind-primary text-2xl font-semibold mb-4">
          Regenerate Prompt
        </div>

        {/* Text Area for Prompt */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Give your detailed regenerate prompt if exist, or just leave this empty"
          className="w-full h-24 p-2 text-documind-text-secondary font-medium border-2 border-gray-300 rounded-md focus:outline-none mb-4"
        />

        {/* Regenerate Button */}
        <button
          className="bg-[#4a90e2] text-white font-medium px-4 py-2 rounded-md hover:bg-[#3a80d2]"
          onClick={handleRegenerate}
        >
          Regenerate
        </button>
      </div>
    </div>
  );
};

export default RegeneratePromptModal;
