"use client";

import React, { useState } from "react";
import ReportQuestionModal from "../modals/ReportQuestionModal";
import RegeneratePromptModal from "../modals/RegeneratePromptModal";
import AIRoomChatModal from "../modals/AIRoomChatModal";

type QuestionMode = "multiple" | "essay";

type QuestionAnswerBody = {
  question: string;
  hint: string;
  answers: string[];
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
  isCorrect: boolean;
};

const Questions = () => {
  const [activeTab, setActiveTab] = useState<QuestionMode>("essay");
  const [reportQuestion, setReportQuestion] = useState<string>("");
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);

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

  const handleFlagClick = (question: string) => {
    setReportQuestion(question);
    setShowReportModal(true);
  };

  const handleCloseModal = () => {
    setShowReportModal(false);
  };

  const handleCheckAllClick = () => {
    setShowResults(true);
  };

  const [showRegenerateModal, setShowRegenerateModal] =
    useState<boolean>(false);

  const handleRegenerateModal = () => {
    setShowRegenerateModal(!showRegenerateModal);
  };

  const [showConversationModal, setShowConversationModal] =
    useState<boolean>(false);

  const [userChat, setUserChat] = useState<string>("");

  const handleStartConversation = (chat: string) => {
    setUserChat(chat);
    setShowConversationModal(true);
  };

  return (
    <div className="p-2 flex flex-col h-full w-fit items-center justify-center">
      <div className={showRegenerateModal ? "" : "hidden"}>
        <RegeneratePromptModal
          onClose={() => {
            handleRegenerateModal();
            setShowResults(false);
          }}
        />
      </div>
      <div>
        <AIRoomChatModal
          initialChats={[{ sender: "user", message: userChat }]}
          onClose={() => {
            setShowConversationModal(false);
          }}
          show={showConversationModal}
        />
      </div>
      {/* Switch for Multiple Choice and Essay */}
      <div className="flex gap-1 mb-2 w-full">
        <button
          className={`px-2 py-1 rounded-md hover:bg-blue-600 hover:text-white ${
            activeTab === "multiple" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("multiple")}
          disabled={showResults}
        >
          Multiple Choice
        </button>
        <button
          className={`px-2 py-1 rounded-md hover:bg-blue-600 hover:text-white ${
            activeTab === "essay" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
          onClick={() => setActiveTab("essay")}
          disabled={showResults}
        >
          Essay
        </button>
      </div>

      {/* Body split into two columns */}
      <div className="flex gap-10">
        {/* Left Body: Questions and Answers */}
        <div className="flex-1 mr-2">
          {showResults
            ? questions.map((item, index) => (
                <div key={index} className="mb-2 border-b pb-1">
                  <h3 className="font-semibold text-xs">{item.question}</h3>
                  <span className="text-xs">
                    Your Answer is {item.isCorrect ? "Correct" : "Wrong"}
                  </span>
                  <p className="text-xs">Your Answer: {item.userAnswer}</p>
                  <p className="text-xs">
                    Correct Answer: {item.correctAnswer}
                  </p>
                  <p className="text-gray-600 text-xs">
                    Explanation: {item.explanation}
                  </p>
                  <button
                    onClick={() =>
                      handleStartConversation(
                        "Explain me more about " + item.question
                      )
                    }
                    className="mt-1 bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600 text-xs"
                  >
                    Start a Conversation
                  </button>
                </div>
              ))
            : questions.map((item, index) => (
                <div key={index} className="mb-2 border-b pb-1">
                  <div className="flex justify-between">
                    <h3 className="font-semibold text-xs">{item.question}</h3>
                    <button
                      className="flex items-center text-red-500 text-xs"
                      onClick={() => handleFlagClick(item.question)}
                    >
                      {/* Flag Icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M2 2h2v16H2V2zm0 0h2v16H2V2zm2.5 0h6l-1 2H5.5L8 8h5l-1 2H6.5l2 4H8l-2-4H2V2h2.5z" />
                      </svg>
                      Report
                    </button>
                  </div>

                  {activeTab === "multiple" ? (
                    <div className="flex flex-col mb-1">
                      {item.answers.map((answer, answerIndex) => (
                        <label
                          key={answerIndex}
                          className="flex items-center mb-1 text-xs"
                        >
                          <input
                            type="radio"
                            name={`question-${index}`}
                            className="mr-1"
                          />
                          {answer}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      placeholder="Insert your answer here"
                      className="w-full text-xs h-16 p-1 border border-gray-300 rounded-md focus:outline-none mb-1"
                    />
                  )}

                  <p className="text-gray-600 text-xs">{item.hint}</p>
                </div>
              ))}
        </div>

        {/* Right Body: Your Statistics */}
        {showResults ? (
          <div className="w-1/3 text-xs">
            <h4 className="font-semibold mb-1">Your Statistics</h4>
            <div className="mb-2">
              <span>Accuracy: 80.00%</span>
              <div
                className="h-1 bg-blue-300 w-full rounded mt-1"
                style={{ width: "80%" }}
              />
            </div>
            <div className="mb-2">
              <span>Time Spent: 50.00s</span>
              <div
                className="h-1 bg-blue-300 w-full rounded mt-1"
                style={{ width: "50%" }}
              />
            </div>
            <h4 className="font-semibold mt-2 mb-1">Learn More About:</h4>
            <ul className="list-disc pl-5">
              <li>Lorem Ipsum Definition</li>
              <li>History of Lorem Ipsum</li>
              <li>Directions of Lorem Ipsum</li>
            </ul>
          </div>
        ) : (
          <div className="w-1/3 text-xs">
            <div className="flex justify-between mb-1">
              <h4 className="font-semibold">Your Progress</h4>
              <span>Attempt: 1/10</span>
            </div>
            <div className="flex justify-between">
              <span>Answered: 8/10</span>
              <span>Elapsed: 45s</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="flex gap-1 mt-2 w-full justify-center">
        <button
          className="bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600"
          onClick={() => setShowRegenerateModal(true)}
        >
          Regenerate
        </button>
        <button
          className="bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600"
          onClick={handleCheckAllClick}
        >
          Check All
        </button>
        <button className="bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600">
          Save Questions
        </button>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportQuestionModal
          question={reportQuestion}
          onSubmit={(report) => {
            console.log("Report submitted:", report);
            handleCloseModal();
          }}
        />
      )}
    </div>
  );
};

export default Questions;
