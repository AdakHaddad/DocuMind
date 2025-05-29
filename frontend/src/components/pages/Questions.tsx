"use client";

import React, { useState } from "react";
import ReportQuestionModal from "../modals/ReportQuestionModal";
import RegeneratePromptModal from "../modals/RegeneratePromptModal";
import AIRoomChatModal from "../modals/AIRoomChatModal";

const MODE_MULTIPLE = "multiple";
const MODE_ESSAY = "essay";

type QuestionMode = typeof MODE_MULTIPLE | typeof MODE_ESSAY;

type QuestionAnswerBody = {
  question: string;
  hint: string;
  answers: string[];
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
  isCorrect: boolean;
};

export default function Questions() {
  const [activeTab, setActiveTab] = useState<QuestionMode>(MODE_ESSAY);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportQuestion, setReportQuestion] = useState("");
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showConversationModal, setShowConversationModal] = useState(false);
  const [userChat, setUserChat] = useState("");

  const questions: QuestionAnswerBody[] = [
    {
      question:
        "What is the definition of Lorem Ipsum and why does it have Dolor sit Amet?",
      hint: "Remember: the definition of Lorem Ipsum.",
      answers: [
        "It is simply dummy text of the printing and typesetting industry.",
        "It is a standard chunk of text used since the 1500s.",
        "It is used to demonstrate the visual form of a document.",
        "All of the above."
      ],
      correctAnswer: "All of the above.",
      userAnswer: "All of the above.",
      explanation:
        "Lorem Ipsum is used as a placeholder text in design and typesetting.",
      isCorrect: true
    },
    {
      question: "What is the purpose of using Lorem Ipsum?",
      hint: "Hint: It's commonly used in publishing.",
      answers: [
        "To fill space in a document.",
        "To make text look more appealing.",
        "To avoid the distraction of readable content.",
        "All of the above."
      ],
      correctAnswer: "To avoid the distraction of readable content.",
      userAnswer: "To fill space in a document.",
      explanation:
        "Lorem Ipsum helps avoid the distraction of readable content.",
      isCorrect: false
    }
  ];

  const handleFlag = (q: string) => {
    setReportQuestion(q);
    setShowReportModal(true);
  };

  const handleStartChat = (q: string) => {
    setUserChat(q);
    setShowConversationModal(true);
  };

  return (
    <div className="flex flex-col p-4 gap-4 items-center">
      {showRegenerateModal && (
        <RegeneratePromptModal
          onClose={() => {
            setShowRegenerateModal(false);
            setShowResults(false);
          }}
        />
      )}

      {showConversationModal && (
        <AIRoomChatModal
          initialChats={[{ sender: "user", message: userChat }]}
          show={showConversationModal}
          onClose={() => setShowConversationModal(false)}
        />
      )}

      {/* Mode Switch */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab(MODE_MULTIPLE)}
          disabled={showResults}
          className={`px-3 py-1 rounded-md font-medium ${
            activeTab === MODE_MULTIPLE
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Multiple Choice
        </button>
        <button
          onClick={() => setActiveTab(MODE_ESSAY)}
          disabled={showResults}
          className={`px-3 py-1 rounded-md font-medium ${
            activeTab === MODE_ESSAY
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Essay
        </button>
      </div>

      {/* Main Body */}
      <div className="flex gap-6 w-full max-w-7xl">
        {/* Left: Questions */}
        <div className="flex-1 space-y-4">
          {questions.map((q, index) => (
            <div key={index} className="border-b pb-2 text-sm space-y-1">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold">{q.question}</h3>
                {!showResults && (
                  <button
                    onClick={() => handleFlag(q.question)}
                    className="text-red-500 text-xs flex items-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 2h2v16H2V2zm2.5 0h6l-1 2H5.5L8 8h5l-1 2H6.5l2 4H8l-2-4H2V2h2.5z" />
                    </svg>
                    Report
                  </button>
                )}
              </div>

              {showResults ? (
                <div className="space-y-1">
                  <p>Your Answer: {q.userAnswer}</p>
                  <p>
                    Result:{" "}
                    <span
                      className={
                        q.isCorrect ? "text-green-600" : "text-red-600"
                      }
                    >
                      {q.isCorrect ? "Correct" : "Wrong"}
                    </span>
                  </p>
                  <p>Correct Answer: {q.correctAnswer}</p>
                  <p className="text-gray-600">Explanation: {q.explanation}</p>
                  <button
                    onClick={() =>
                      handleStartChat("Explain more: " + q.question)
                    }
                    className="mt-1 px-3 py-1 rounded-md text-xs bg-blue-500 text-white hover:bg-blue-600"
                  >
                    Start a Conversation
                  </button>
                </div>
              ) : activeTab === MODE_MULTIPLE ? (
                <div className="space-y-1">
                  {q.answers.map((ans, i) => (
                    <label key={i} className="flex items-center gap-2">
                      <input type="radio" name={`q-${index}`} />
                      {ans}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className="w-full border border-gray-300 rounded-md p-1"
                  placeholder="Type your answer..."
                  rows={3}
                />
              )}
              {!showResults && (
                <p className="text-gray-500 text-xs">Hint: {q.hint}</p>
              )}
            </div>
          ))}
        </div>

        {/* Right: Stats or Progress */}
        <div className="w-1/3 space-y-3 text-sm">
          {showResults ? (
            <>
              <h4 className="font-semibold">Your Statistics</h4>
              <div>
                <span>Accuracy: 80%</span>
                <div className="h-2 bg-blue-200 rounded mt-1 w-4/5" />
              </div>
              <div>
                <span>Time Spent: 50s</span>
                <div className="h-2 bg-blue-200 rounded mt-1 w-1/2" />
              </div>
              <h4 className="font-semibold mt-4">Learn More About:</h4>
              <ul className="list-disc pl-5">
                <li>Lorem Ipsum Definition</li>
                <li>History of Lorem Ipsum</li>
                <li>Directions of Lorem Ipsum</li>
              </ul>
            </>
          ) : (
            <>
              <h4 className="font-semibold">Your Progress</h4>
              <div className="flex justify-between">
                <span>Attempt: 1/10</span>
                <span>Elapsed: 45s</span>
              </div>
              <div className="flex justify-between">
                <span>Answered: 8/10</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setShowRegenerateModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Regenerate
        </button>
        <button
          onClick={() => setShowResults(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Check All
        </button>
        <button className="bg-white border border-blue-500 text-blue-500 px-4 py-2 rounded-md hover:bg-blue-100">
          Save Questions
        </button>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportQuestionModal
          question={reportQuestion}
          onSubmit={(report) => {
            console.log("Report:", report);
            setShowReportModal(false);
          }}
        />
      )}
    </div>
  );
}
