"use client";

import React, { useCallback, useEffect, useState } from "react";
import ReportQuestionModal from "../modals/ReportQuestionModal";
import RegeneratePromptModal from "../modals/RegeneratePromptModal";
import AIRoomChatModal from "../modals/AIRoomChatModal";
import StatisticsPage from "../Statistics";
import { useParams } from "next/navigation";
import { DocumentObject } from "@/src/app/[user]/page";

type QuestionMode = "multiple" | "essay";

export type QuestionAnswerBody = {
  question: string;
  answers: string[];
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
  isCorrect: boolean;
};

export interface SingleStatistic {
  correct: number;
  incorrect: number;
  accuracy: number;
  timeEnd: Date;
  timeSpent: number;
  timeStart: Date;
}

export default function Questions() {
  const params = useParams();
  const [document, setDocument] = useState<DocumentObject | null>(null);
  const [statistics, setStatistics] = useState<SingleStatistic[]>([]);
  const slug = params?.documents as string;
  const [activeTab, setActiveTab] = useState<QuestionMode>("essay");
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [reportModalOpenIndex, setReportModalOpenIndex] = useState<
    number | null
  >(null);
  const [chatModalOpenIndex, setChatModalOpenIndex] = useState<number | null>(
    null
  );
  const [quizesId, setQuizesId] = useState<string>("");
  const [questions, setQuestions] = useState<QuestionAnswerBody[]>([]);

  const [startTime, setStartTime] = useState<Date | null>(null);
  useEffect(() => {
    if (questions.length > 0 && !startTime) {
      setStartTime(new Date());
    }
  }, [questions, startTime]);

  const [elapsedTime, setElapsedTime] = useState("00:00:00");

  useEffect(() => {
    if (!startTime || showResults) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = now.getTime() - startTime.getTime();

      const seconds = Math.floor((elapsed / 1000) % 60);
      const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
      const hours = Math.floor(elapsed / (1000 * 60 * 60));

      const formatted = `${hours}:${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
      setElapsedTime(formatted);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, showResults]);

  const createQuestions = useCallback(
    async ({ regen = null }: { regen: string | null }) => {
      try {
        const response = await fetch(`/api/learning/quizes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            documentId: document!._id,
            count: 10,
            regeneratePrompt: regen // Optional prompt for regeneration
          })
        });

        if (!response.ok) {
          console.error("Failed to create quizes");
          return;
        }

        const data = await response.json();

        // raw quizes
        const raw = data.quizes;

        // fill the state
        const quizes: QuestionAnswerBody[] = raw.map(
          (quiz: { question: string; options: string[]; answer: string }) => ({
            question: quiz.question,
            answers: quiz.options,
            correctAnswer: quiz.answer,
            userAnswer: null,
            explanation: null,
            isCorrect: null
          })
        );

        setQuizesId(data.id);
        setQuestions(quizes);
      } catch (error) {
        console.error("Error creating questions:", error);
      }
    },
    [document]
  );

  // 1. Fetch document once when slug changes
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

      setDocument(data);
    };

    fetchData();
  }, [slug]);

  // 2. Fetch quizes once document is available
  useEffect(() => {
    if (!document) return;

    const fetchQuestions = async () => {
      try {
        const response = await fetch(
          `/api/learning/quizes?docsId=${document._id}`,
          {
            method: "GET"
          }
        );

        let data = null;

        if (!response.ok) {
          data = await response.json();
          if (data.error === "Quizes not found") {
            await createQuestions({ regen: null });
          } else {
            console.error("Failed to fetch quizes");
            return;
          }
        }

        data = await response.json();
        const raw = data.quizes;
        // fill the state
        setQuizesId(data._id);
        const quizes: QuestionAnswerBody[] = raw.map(
          (quiz: { question: string; options: string[]; answer: string }) => ({
            question: quiz.question,
            answers: quiz.options,
            correctAnswer: quiz.answer,
            userAnswer: null,
            explanation: null,
            isCorrect: null
          })
        );

        // Make session
        await fetch(`/api/learning/quizes/answers`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            quizesId: data._id
          })
        });

        setQuestions(quizes);
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    fetchQuestions();
  }, [document, createQuestions, setQuizesId]);

  // Fetch statistics
  useEffect(() => {
    const fetchStatistics = async () => {
      if (!quizesId) return;
      try {
        const response = await fetch(
          `/api/learning/quizes/answers?quizesId=${quizesId}`,
          {
            method: "GET"
          }
        );
        if (!response.ok) {
          console.error("Failed to fetch statistics");
          return;
        }
        const data = await response.json();
        const attempts = data.attempts as SingleStatistic[];
        setStatistics(attempts);
        // set the start time according to last active attempt here
        if (attempts.length > 0) {
          const lastAttempt = attempts[attempts.length - 1];
          setStartTime(new Date(lastAttempt.timeStart));
        } else {
          setStartTime(new Date());
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      }
    };
    fetchStatistics();
  }, [quizesId]);

  const checkAll = async () => {
    // Construct the answers array
    const answersPayload = questions.map((q) => q.userAnswer);

    try {
      const response = await fetch(`/api/learning/quizes/answers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          quizesId: quizesId,
          quizType: activeTab,
          answers: answersPayload
        })
      });

      if (!response.ok) {
        console.error("Failed to submit answers");
        return;
      }

      const result = await response.json();
      const results = result.results;

      // Apply results (explanations + isCorrect)
      const enriched = questions.map((q, idx) => ({
        ...q,
        explanation: results[idx].explanation || "",
        isCorrect: results[idx].isCorrect || false
      }));

      setQuestions(enriched);
      setShowResults(true);
    } catch (error) {
      console.error("Error submitting answers:", error);
    }
  };

  const primaryButtonClasses = `border-3 border-[#4a90e2] bg-[#4a90e2] text-white text-lg px-6 py-2 rounded-md font-bold hover:bg-[#3a80d2] hover:border-[#3a80d2] transition-colors hover:cursor-pointer shadow-md`;
  const secondaryButtonClasses = `border-3 border-[#4a90e2] bg-white text-[#3a80d2] text-lg  px-6 py-2 rounded-md font-bold hover:bg-gray-400 hover:border-gray-400 hover:text-white transition-colors cursor-pointer shadow-md`;
  const tertiaryButtonClasses = `border-3 border-[#F5A623] bg-[#F5A623] text-white text-lg px-6 py-2 rounded-md font-bold hover:bg-gray-400 hover:bg-orange-400 hover:border-orange-400 transition-colors cursor-pointer shadow-md`;

  if (!document) return;

  return (
    <div className="flex flex-col max-w-screen lg:w-90/100 py-6 px-8 gap-4 rounded-md items-center shadow-[-2px_2px_10px_0px_rgba(0,0,0,0.3)]">
      {showRegenerateModal && (
        <RegeneratePromptModal
          onClose={() => {
            setShowRegenerateModal(false);
            setShowResults(false);
          }}
          documentId={document._id}
          type="quizes"
        />
      )}

      {/* Mode Switch */}
      <div className="flex gap-4 w-full justify-start">
        <button
          onClick={() => setActiveTab("multiple")}
          disabled={showResults}
          className={`px-6 py-2 rounded-md font-medium text-lg ${
            activeTab === "multiple"
              ? "ring-2 ring-[#4a90e2] bg-[#4a90e2] text-white"
              : "ring-2 ring-gray-400 text-gray-400 hover:bg-gray-400 hover:ring-gray-400 hover:text-white cursor-pointer transition-colors"
          }`}
        >
          Multiple Choices
        </button>
        <button
          onClick={() => setActiveTab("essay")}
          disabled={showResults}
          className={`px-6 py-2 rounded-md font-medium text-lg ${
            activeTab === "essay"
              ? "ring-2 ring-[#4a90e2] bg-[#4a90e2] text-white"
              : "ring-2 ring-gray-400 text-gray-400 hover:bg-gray-400 hover:ring-gray-400 hover:text-white cursor-pointer transition-colors"
          }`}
        >
          Essay
        </button>
      </div>

      {/* Main Body */}
      <div className="flex gap-10 w-full justify-around">
        {/* Left: Questions */}
        <div className="border-2 border-gray-300 bg-gray-100 rounded-xl p-3 flex-1 overflow-y-auto max-h-123 max-w-2/3 space-y-6">
          {questions.map((q, index) => (
            <div key={index} className="pb-2 text-lg">
              <div className="flex justify-between pb-3 items-center">
                <h3 className="font-semibold">{q.question}</h3>

                <div className="flex gap-2">
                  <button
                    onClick={() => setReportModalOpenIndex(index)}
                    className="text-black px-3 py-2 rounded-md text-sm flex items-center bg-documind-secondary font-bold hover:bg-red-400 cursor-pointer transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="black"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 2h2v16H2V2zm2.5 0h6l-1 2H5.5L8 8h5l-1 2H6.5l2 4H8l-2-4H2V2h2.5z" />
                    </svg>
                    Report
                  </button>
                </div>
              </div>

              {showResults ? (
                <div>
                  <p>
                    <span
                      className={
                        q.isCorrect
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {q.isCorrect
                        ? "Your Answer is Correct"
                        : "Your Answer is Wrong"}
                    </span>
                  </p>
                  <p className="font-medium">Your Answer:</p>
                  <p className="mb-2">{q.userAnswer}</p>
                  <p className="font-medium">Correct Answer:</p>
                  <p className="mb-2">{q.correctAnswer}</p>
                  <p className="font-medium">Explanation:</p>
                  <p className="mb-2">{q.explanation}</p>
                  <button
                    onClick={() => setChatModalOpenIndex(index)}
                    className="border-1 border-[#4a90e2] bg-[#4a90e2] text-white text-base px-3 py-2 rounded-md font-medium hover:bg-[#3a80d2] hover:border-[#3a80d2] transition-colors hover:cursor-pointer shadow-md"
                  >
                    Start a Conversation
                  </button>
                </div>
              ) : activeTab === "multiple" ? (
                <div className="space-y-1">
                  {q.answers.map((ans, i) => (
                    <label key={i} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`q-${index}`}
                        value={ans}
                        checked={q.userAnswer === ans}
                        onChange={() => {
                          const updated = [...questions];
                          updated[index].userAnswer = ans;
                          setQuestions(updated);
                        }}
                      />
                      {ans}
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 font-normal"
                  placeholder="Type your answer..."
                  rows={3}
                  value={q.userAnswer || ""}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[index].userAnswer = e.target.value;
                    setQuestions(updated);
                  }}
                />
              )}

              {/* Per-Question Report Modal */}
              {reportModalOpenIndex === index && (
                <ReportQuestionModal
                  document={document}
                  question={q.question}
                  onClose={() => setReportModalOpenIndex(null)}
                  onSubmit={() => {
                    setReportModalOpenIndex(null);
                  }}
                />
              )}

              {/* Per-Question Chat Modal */}
              {chatModalOpenIndex === index && (
                <AIRoomChatModal
                  document={document}
                  show={chatModalOpenIndex === index}
                  onClose={() => setChatModalOpenIndex(null)}
                  purpose="quiz"
                  quiz={q}
                />
              )}
            </div>
          ))}
        </div>

        {/* Right: Stats or Progress */}
        <div className="w-1/3 h-fit px-5 py-2 space-y-3 text-sm ring-4 rounded-md ring-documind-primary">
          {showResults ? (
            <div className="flex justify-center items-center">
              <StatisticsPage statistics={statistics} />
            </div>
          ) : (
            <>
              <h4 className="text-3xl text-documind-text-primary font-bold">
                <span className="text-documind-text-primary">Your </span>
                <span className="text-documind-primary">Progress</span>
              </h4>
              <div className="text-lg mb-2 text-documind-text-primary font-bold flex justify-between">
                <span className="bg-blue-100 p-2 mr-4 w-1/3 text-center rounded-full shadow-[-2px_2px_6px_0px_rgba(0,0,0,0.3)]">
                  Attempt
                  <br />
                  <span className="text-documind-primary">
                    {
                      // Get the attempts count from the statistics
                      statistics.length > 0 ? statistics.length : "0"
                    }
                  </span>
                </span>
                <span className="bg-blue-100 p-2 mr-4 w-1/3 text-center rounded-full shadow-[-2px_2px_6px_0px_rgba(0,0,0,0.3)]">
                  Answered
                  <br />
                  <span className="text-documind-primary">
                    {
                      // from answered questions
                      questions.filter((q) => q.userAnswer).length +
                        " / " +
                        questions.length
                    }
                  </span>
                </span>
                <span className="bg-blue-100 p-2 w-1/3 text-center rounded-full shadow-[-2px_2px_6px_0px_rgba(0,0,0,0.3)]">
                  Elapsed
                  <br />
                  <span className="text-documind-primary">{elapsedTime}</span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setShowRegenerateModal(true)}
          className={`${primaryButtonClasses}`}
        >
          Regenerate
        </button>
        <button onClick={() => checkAll()} className={tertiaryButtonClasses}>
          Check All
        </button>
        <button className={secondaryButtonClasses}>Save Questions</button>
      </div>
    </div>
  );
}
