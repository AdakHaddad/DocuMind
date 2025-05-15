"use client";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useParams } from "next/navigation";

export default function FlashcardView() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const params = useParams();
  const documentName = params.view as string;

  // Dummy flashcards data - in real app this would come from props/API
  const flashcards = [
    {
      question: "What is the main purpose of this document?",
      answer: "This is a demo document showing how flashcards work."
    },
    {
      question: "How many flashcards are generated?",
      answer: "Three flashcards are generated for this demo."
    },
    {
      question: "Is this a real document processing?",
      answer: "No, this is a demo with dummy data."
    }
  ];

  const handlePrevious = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : flashcards.length - 1));
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev < flashcards.length - 1 ? prev + 1 : 0));
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Flashcards</h1>
          <p className="text-gray-600 mb-2">Document: {documentName}</p>
          <p className="text-gray-600">
            Card {currentIndex + 1} of {flashcards.length}
          </p>
        </div>

        {/* Flashcard */}
        <div className="relative aspect-[4/3] max-w-2xl mx-auto mb-8">
          <div
            className={`w-full h-full transition-transform duration-500 transform-style-3d ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            onClick={handleFlip}
          >
            {/* Front of card */}
            <div
              className={`absolute w-full h-full bg-white rounded-xl shadow-lg p-8 backface-hidden ${
                isFlipped ? "hidden" : "block"
              }`}
            >
              <div className="h-full flex flex-col">
                <div className="text-sm text-gray-500 mb-4">Question</div>
                <div className="text-xl font-medium text-gray-800 flex-1 flex items-center justify-center text-center">
                  {flashcards[currentIndex].question}
                </div>
                <div className="text-sm text-gray-500 mt-4 text-center">
                  Click to flip
                </div>
              </div>
            </div>

            {/* Back of card */}
            <div
              className={`absolute w-full h-full bg-white rounded-xl shadow-lg p-8 backface-hidden rotate-y-180 ${
                isFlipped ? "block" : "hidden"
              }`}
            >
              <div className="h-full flex flex-col">
                <div className="text-sm text-gray-500 mb-4">Answer</div>
                <div className="text-xl font-medium text-gray-800 flex-1 flex items-center justify-center text-center">
                  {flashcards[currentIndex].answer}
                </div>
                <div className="text-sm text-gray-500 mt-4 text-center">
                  Click to flip back
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-center items-center gap-4">
          <button
            onClick={handlePrevious}
            className="p-3 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>
          <button
            onClick={handleFlip}
            className="p-3 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-6 h-6 text-gray-600" />
          </button>
          <button
            onClick={handleNext}
            className="p-3 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      <style jsx global>{`
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
