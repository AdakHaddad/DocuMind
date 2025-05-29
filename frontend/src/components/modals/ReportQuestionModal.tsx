"use client";

import React, { useState } from "react";

type ReportQuestionModalProps = {
  question: string;
  onSubmit: (report: string) => void;
};

const ReportQuestionModal: React.FC<ReportQuestionModalProps> = ({
  question,
  onSubmit
}) => {
  const [report, setReport] = useState("");

  const handleReport = () => {
    // Logic to handle reporting the question with the provided details
    console.log("Reporting question:", question);
    console.log("Report details:", report);
    // Clear the input after reporting
    setReport("");
    // Call the onSubmit function to notify the parent component
    onSubmit(report);
  };

  return (
    <div className="flex items-center justify-center w-full h-full bg-black/40 z-[1] fixed top-0 left-0">
      <div className="bg-white rounded-lg border-2 border-orange-400 w-[400px] p-4 shadow-xl flex flex-col items-center justify-center">
        {/* Header */}
        <div className="text-center font-semibold text-orange-700 mb-4">
          Reporting Question:
        </div>

        {/* Display the Question */}
        <div className="mb-2 text-gray-800">{question}</div>

        {/* Text Area for Report Details */}
        <textarea
          value={report}
          onChange={(e) => setReport(e.target.value)}
          placeholder="Give your detailed report if exist, or just leave this empty"
          className="w-full h-24 p-2 border border-gray-300 rounded-md focus:outline-none mb-4"
        />

        {/* Report Button */}
        <button
          className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
          onClick={handleReport}
        >
          Report
        </button>
      </div>
    </div>
  );
};

export default ReportQuestionModal;
