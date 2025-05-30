"use client";

import { DocumentObject } from "@/src/app/[user]/page";
import React, { useState } from "react";

type ReportQuestionModalProps = {
  document: DocumentObject;
  question: string;
  onSubmit: () => void;
  onClose: () => void;
};

const ReportQuestionModal: React.FC<ReportQuestionModalProps> = ({
  document,
  question,
  onSubmit,
  onClose
}) => {
  const [report, setReport] = useState("");

  const handleReport = async () => {
    // Logic to handle reporting the question with the provided details
    try {
      const response = await fetch("/api/learning/report", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          documentId: document._id,
          question: question,
          reportDetails: report
        })
      });

      if (!response.ok) {
        throw new Error("Failed to submit report");
      }

      // Optionally, reset the report reason or show a success message
      setReport("");
      alert("Report submitted successfully!");

      onSubmit();
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again later.");
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-full z-[1] fixed top-0 left-0">
      {/* Clickable background to close report */}
      <div
        onClick={onClose}
        className="bg-black/40 w-full h-full fixed top-0 left-0 z-[2]"
      />
      <div className="bg-white rounded-lg ring-3 ring-orange-400 w-[50%] p-5 shadow-xl flex flex-col items-center justify-center z-[3]">
        {/* Header */}
        <div className="text-center text-2xl font-bold text-orange-500 mb-4">
          Reporting Question:
        </div>

        {/* Display the Question */}
        <div className="mb-4 text-lg font-medium text-gray-800">{question}</div>

        {/* Text Area for Report Details */}
        <textarea
          value={report}
          onChange={(e) => setReport(e.target.value)}
          placeholder="Give your detailed report if exist, or just leave this empty"
          className="w-full h-24 p-2 ring-2 ring-gray-300 rounded-md focus:ring-gray-600 mb-4"
        />

        {/* Report Button */}
        <button
          className="bg-documind-secondary font-medium text-white px-4 py-2 rounded-md hover:bg-orange-500"
          onClick={handleReport}
        >
          Report
        </button>
      </div>
    </div>
  );
};

export default ReportQuestionModal;
