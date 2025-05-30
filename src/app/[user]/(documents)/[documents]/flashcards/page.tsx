"use client";
import React, { useCallback, useEffect, useState } from "react";
import Flashcard from "@/src/components/pages/Flashcard";
import RegeneratePromptModal from "@/src/components/modals/RegeneratePromptModal";
import { DocumentObject } from "../../../page";
import { useParams } from "next/navigation";
import { flashcards } from "@/src/utils/routes";

export type FlashcardStateType = "question" | "answer" | "report_reason";

export type FlashcardState = {
  question: string;
  answer?: string;
  state: FlashcardStateType;
};

export default function Flashcards() {
  const params = useParams();
  const [docData, setDocData] = useState<DocumentObject | null>(null);
  const slug = params?.documents as string;
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);

  const [cards, setCards] = useState<FlashcardState[]>([]);

  const createFlashcards = useCallback(
    async ({ regen = null }: { regen: string | null }) => {
      try {
        const response = await fetch(`/api/learning/flashcards`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            documentId: docData!._id,
            count: 10,
            regeneratePrompt: regen
          })
        });

        if (!response.ok) {
          console.error("Failed to create flashcards");
          return;
        }

        const data = await response.json();
        const raw = data.flashcards;

        const flashcards: FlashcardState[] = raw.map(
          (card: { question: string; answer: string }) => ({
            question: card.question,
            answer: card.answer,
            state: "question"
          })
        );

        setCards(flashcards);
      } catch (error) {
        console.error("Error creating flashcards:", error);
      }
    },
    [docData]
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      const response = await fetch(`/api/learning/documents?slug=${slug}`, {
        method: "GET"
      });

      if (!response.ok) {
        window.location.href = `/${slug}`;
        return;
      }

      const data = await response.json();

      if (!data || !data._id) {
        console.error("Document not found or invalid data");
        window.location.href = `/${slug}`;
        return;
      }

      setDocData(data);
    };

    fetchData();
  }, [slug]);

  useEffect(() => {
    if (!docData) return;

    const fetchFlashcards = async () => {
      try {
        const response = await fetch(
          `/api/learning/flashcards?docsId=${docData._id}`,
          {
            method: "GET"
          }
        );

        let data = null;

        if (!response.ok) {
          data = await response.json();
          if (data.error === "No flashcards found for this document") {
            await createFlashcards({ regen: null });
          } else {
            console.error("Failed to fetch flashcards");
            return;
          }
        }

        data = await response.json();
        const raw = data.flashcards;

        const flashcards: FlashcardState[] = raw.map(
          (card: { question: string; answer: string }) => ({
            question: card.question,
            answer: card.answer,
            state: "question"
          })
        );

        setCards(flashcards);
      } catch (error) {
        console.error("Error fetching flashcards:", error);
      }
    };

    fetchFlashcards();
  }, [docData, createFlashcards]);

  const handleRegenerateModal = () => {
    setShowRegenerateModal((prev) => !prev);
  };

  if (!flashcards) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading flashcards...</p>
      </div>
    );
  }

  if (!docData) return;

  // Add this function inside the component
  const handleDownload = () => {
    const json = JSON.stringify(cards, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${docData?.title + "-flashcards" || "flashcards"}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col max-h-screen items-center justify-center">
      {/* Regenerate Modal */}
      {showRegenerateModal && (
        <RegeneratePromptModal
          onClose={handleRegenerateModal}
          documentId={docData._id}
          type="flashcards"
        />
      )}

      {/* Main Content */}
      <div className="max-w-7xl lg:max-h-[72vh] mx-auto bg-white rounded-2xl p-8 shadow-[-2px_3px_10px_0px_rgba(0,0,0,0.3)] flex flex-col">
        {/* Flashcards container */}
        <div
          className="flex flex-wrap gap-6 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 220px)" }}
        >
          {cards.map((card, index) => (
            <div
              key={index}
              className="flex-grow basis-[calc(33.333% - 1.5rem)] min-w-[250px]"
              style={{ minHeight: "300px" }}
            >
              <Flashcard
                state={card.state}
                questionText={card.question}
                answerText={card.answer}
                document={docData}
              />
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-center items-center gap-4 mt-6 flex-shrink-0">
          <button
            onClick={handleRegenerateModal}
            className="border-3 border-[#4a90e2] bg-[#4a90e2] text-white px-6 py-2 rounded-md font-medium hover:bg-[#3a80d2] hover:border-[#3a80d2] hover:cursor-pointer transition-colors shadow-md"
          >
            Regenerate
          </button>
          <button
            onClick={handleDownload}
            className="border-3 border-[#4a90e2] bg-white text-[#3a80d2] px-6 py-2 rounded-md font-medium hover:bg-gray-400 hover:border-gray-400 hover:text-white hover:cursor-pointer transition-colors shadow-md"
          >
            Save Flash Cards
          </button>
        </div>
      </div>
    </div>
  );
}
