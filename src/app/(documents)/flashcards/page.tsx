"use client";
import React, { useState } from "react";
import Flashcard from "@/src/components/pages/Flashcard";
import RegeneratePromptModal from "@/src/components/modals/RegeneratePromptModal";

const STATE_QUESTION = "question";
const STATE_ANSWER = "answer";
const STATE_REPORT_REASON = "report_reason";

export default function Flashcards() {
  const [showRegenerateModal, setShowRegenerateModal] =
    useState<boolean>(false);

  const handleRegenerateModal = () => {
    setShowRegenerateModal(!showRegenerateModal);
  };

  return (
    <div className="flex flex-col max-h-screen items-center justify-center">
      <div className={showRegenerateModal ? "" : "hidden"}>
        <RegeneratePromptModal
          onClose={() => {
            handleRegenerateModal();
          }}
        />
      </div>
      {/* Main Content */}
      <div className="max-w-7xl max-h-screen mx-auto bg-white rounded-2xl p-8 shadow-[-2px_3px_10px_0px_rgba(0,0,0,0.3)]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  place-items-center gap-6 ">
          {/* FLASHCARDS */}
          <Flashcard
            initialState={STATE_QUESTION}
            questionText="What is the capital of France?"
          />
          <Flashcard
            initialState={STATE_QUESTION}
            questionText="How many continents are there?"
          />

          {/* Bottom left box in second state (answer) */}
          <Flashcard
            initialState={STATE_ANSWER}
            questionText="What is H2O?"
            answerText="H2O is the chemical formula for water, consisting of two hydrogen atoms and one oxygen atom."
          />

          {/* Bottom right box in third state (report reason) */}
          <Flashcard
            initialState={STATE_REPORT_REASON}
            questionText="Why is the sky blue?" // Question that led to report
            answerText="The sky appears blue because of a phenomenon called Rayleigh scattering..."
          />

          <Flashcard
            initialState={STATE_QUESTION}
            questionText="What is the capital of France?"
          />
          <Flashcard
            initialState={STATE_QUESTION}
            questionText="How many continents are there?"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={handleRegenerateModal}
            className="border-3 border-[#4a90e2] bg-[#4a90e2] text-white px-6 py-2 rounded-md font-medium hover:bg-[#3a80d2] hover:border-[#3a80d2] hover:cursor-pointer transition-colors shadow-md"
          >
            Regenerate
          </button>
          <button className="border-3 border-[#4a90e2] bg-white text-[#3a80d2] px-6 py-2 rounded-md font-medium hover:bg-gray-400 hover:border-gray-400 hover:text-white hover:cursor-pointer transition-colors shadow-md">
            Save Flash Cards
          </button>
        </div>
      </div>
    </div>
  );
}
