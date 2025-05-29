import React, { useState } from "react";
import { FlashcardStateType } from "@/src/app/[user]/(documents)/[documents]/flashcards/page";
import AIRoomChatModal from "../modals/AIRoomChatModal";
import { DocumentObject } from "@/src/app/[user]/page";

const Flashcard = ({
  state = "question" as FlashcardStateType,
  questionText = "What is the definition of Lorem Ipsum and why does it have Dolor sit Amet?",
  answerText = "Because Lorem Ipsum is simply dummy text of the printing and typesetting industry...",
  initialReportText = "",
  initialAskText = "",
  document = {} as DocumentObject
}) => {
  const [currentState, setCurrentState] = useState<FlashcardStateType>(state);
  const [reportReason, setReportReason] = useState(initialReportText);
  const [askText, setAskText] = useState(initialAskText);

  const handleViewAnswer = () => setCurrentState("answer");
  const handleFlip = () => setCurrentState("question");
  const handleAsk = (question: string) => {
    setAskText(question);
    setShowConversationModal(true);
  };

  const handleBackFromReport = () => setCurrentState("answer");
  const handleReportSubmit = async () => {
    try {
      const response = await fetch("/api/learning/report", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          documentId: document._id,
          question: questionText,
          reportDetails: reportReason
        })
      });

      if (!response.ok) {
        throw new Error("Failed to submit report");
      }

      // Optionally, reset the report reason or show a success message
      setReportReason("");
      alert("Report submitted successfully!");
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again later.");
    }

    setCurrentState("question");
  };

  // --- Dynamic Card Styling ---
  let cardContainerClasses =
    "p-4 rounded-xl flex flex-col justify-between min-h-[250px] w-full max-w-sm";
  let currentTextColorClass = "text-text-on-blue"; // Default text color

  if (currentState === "question") {
    cardContainerClasses += " border-3 border-[#4a90e2] shadow-md";
    currentTextColorClass = "text-gray-800 font-medium";
  } else if (currentState === "answer") {
    cardContainerClasses += " bg-[#4a90e2] shadow-lg";
    currentTextColorClass = "text-white font-medium";
  } else if (currentState === "report_reason") {
    cardContainerClasses += " bg-[#4a90e2] shadow-lg";
    currentTextColorClass = "text-text-on-gray-card"; // Use darker text on light background
  }
  // --- End Dynamic Card Styling ---

  const buttonBaseClasses =
    "py-2 px-4 rounded-md font-semibold hover:cursor-pointer text-sm";
  const primaryButtonClasses = `${buttonBaseClasses} bg-[#4a90e2] hover:bg-[#3a80d2] text-white`;
  const secondaryButtonClasses = `${buttonBaseClasses} bg-[#F5A623] hover:bg-orange-400 text-white`;
  const tertiaryButtonClasses = `${buttonBaseClasses} border-3 border-white bg-white text-gray-700 hover:bg-gray-400 hover:border-gray-400 hover:text-white`;
  const askButtonClasses = `${buttonBaseClasses} border-3 border-[#F5A623] bg-white text-[#F5A623] hover:bg-gray-400 hover:border-gray-400 hover:text-white`;

  const [showConversationModal, setShowConversationModal] =
    useState<boolean>(false);

  return (
    <div className={cardContainerClasses}>
      {" "}
      <div>
        <AIRoomChatModal
          initialChats={[{ sender: "user", message: askText }]}
          onClose={() => {
            setShowConversationModal(false);
          }}
          show={showConversationModal}
          document={document}
          purpose="flashcard"
          flashcard={{
            question: questionText,
            answer: answerText
          }}
        />
      </div>
      {/* Apply dynamic classes here */}
      {/* Content Area */}
      <div className={`flex-grow mb-4 ${currentTextColorClass}`}>
        {" "}
        {/* Apply dynamic text color */}
        {currentState === "question" && (
          <p className="text-lg">{questionText}</p>
        )}
        {currentState === "answer" && <p className="text-lg">{answerText}</p>}
        {currentState === "report_reason" && (
          <textarea
            className="w-full h-full p-3 font-medium rounded-md text-gray-700 bg-white placeholder-text-placeholder focus:ring-2 focus:ring-button-blue focus:border-transparent" // Ensure textarea has its own contrasting bg
            placeholder="Type your reason why this needs to be reported..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={5}
          />
        )}
      </div>
      {/* Button Area */}
      <div className="flex gap-2 justify-start">
        {currentState === "question" && (
          <>
            <button onClick={handleViewAnswer} className={primaryButtonClasses}>
              View Answer
            </button>
            <button
              onClick={() => {
                setCurrentState("report_reason");
                setReportReason("");
              }}
              className={secondaryButtonClasses}
            >
              Report
            </button>
          </>
        )}
        {currentState === "answer" && (
          <>
            <button onClick={handleFlip} className={tertiaryButtonClasses}>
              Flip
            </button>
            <button
              onClick={() => {
                handleAsk(
                  "Explain me about " + questionText + " in a detailed way."
                );
              }}
              className={askButtonClasses}
            >
              Ask
            </button>
            <button
              onClick={() => {
                setCurrentState("report_reason");
                setReportReason("");
              }}
              className={secondaryButtonClasses}
            >
              Report
            </button>
          </>
        )}
        {currentState === "report_reason" && (
          <>
            <button
              onClick={handleBackFromReport}
              className={tertiaryButtonClasses}
            >
              Back
            </button>
            <button
              onClick={handleReportSubmit}
              className={`${secondaryButtonClasses} bg-button-blue hover:bg-blue-600`}
            >
              {" "}
              {/* Report button could be blue in this state */}
              Report
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Flashcard;
