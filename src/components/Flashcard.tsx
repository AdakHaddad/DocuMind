import React, { useState } from 'react';

const STATE_QUESTION = 'question';
const STATE_ANSWER = 'answer';
const STATE_REPORT_REASON = 'report_reason';
const STATE_ASK_QUESTION = 'ask_question';

const Flashcard = ({
  initialState = STATE_QUESTION,
  questionText = "What is the definition of Lorem Ipsum and why does it have Dolor sit Amet?",
  answerText = "Because Lorem Ipsum is simply dummy text of the printing and typesetting industry...",
  initialReportText = "",
  initialAskText = "",
}) => {
  const [currentState, setCurrentState] = useState(initialState);
  const [reportReason, setReportReason] = useState(initialReportText);
  const [askText, setAskText] = useState(initialAskText);

  const handleViewAnswer = () => setCurrentState(STATE_ANSWER);
  const handleFlip = () => setCurrentState(STATE_QUESTION);
  const handleAsk = () => {
    setAskText(''); // Clear previous question when entering ask mode
    setCurrentState(STATE_ASK_QUESTION);
  }
  const handleReportButton = () => {
    setReportReason(''); // Clear previous reason when entering report mode
    setCurrentState(STATE_REPORT_REASON);
  }
  const handleBackFromReport = () => setCurrentState(STATE_ANSWER);
  const handleBackFromAsk = () => setCurrentState(STATE_ANSWER);
  const handleReportSubmit = () => {
    console.log("Report submitted:", reportReason);
    setCurrentState(STATE_QUESTION);
  };
  const handleSubmitQuestion = () => {
    console.log("Question submitted:", askText);
    setCurrentState(STATE_QUESTION);
  };

  // --- Dynamic Card Styling ---
  let cardContainerClasses = "p-6 rounded-xl flex flex-col justify-between min-h-[250px] w-full max-w-sm";
  let currentTextColorClass = "text-text-on-blue"; // Default text color

  if (currentState === STATE_QUESTION) {
    cardContainerClasses += " border-3 border-[#4a90e2] shadow-md";
    currentTextColorClass = "text-gray-800 font-medium";
  } else if (currentState === STATE_ANSWER) {
    cardContainerClasses += " bg-[#4a90e2] shadow-lg";
    currentTextColorClass = "text-white font-medium";
  } else if (currentState === STATE_REPORT_REASON) {
    cardContainerClasses += " bg-[#4a90e2] shadow-lg";
    currentTextColorClass = "text-text-on-gray-card"; // Use darker text on light background
  } else if (currentState === STATE_ASK_QUESTION) { // Style for the new state
    cardContainerClasses += " bg-[#4a90e2] shadow-lg";
    currentTextColorClass = "text-text-on-gray-card";
  }
  // --- End Dynamic Card Styling ---


  const buttonBaseClasses = "py-2 px-4 rounded-md font-semibold text-sm";
  const primaryButtonClasses = `${buttonBaseClasses} bg-[#4a90e2] hover:bg-[#3a80d2] text-white`;
  const secondaryButtonClasses = `${buttonBaseClasses} bg-[#F5A623] hover:bg-orange-500 text-white`;
  const tertiaryButtonClasses = `${buttonBaseClasses} border-3 border-white bg-white text-gray-700 hover:bg-gray-400 hover:border-gray-400 hover:text-white`;
  const askButtonClasses = `${buttonBaseClasses} border-3 border-[#F5A623] bg-white text-[#F5A623] hover:bg-gray-400 hover:border-gray-400 hover:text-white`;


  return (
    <div className={cardContainerClasses}> {/* Apply dynamic classes here */}
      {/* Content Area */}
      <div className={`flex-grow mb-4 ${currentTextColorClass}`}> {/* Apply dynamic text color */}
        {currentState === STATE_QUESTION && (
          <p className="text-lg">{questionText}</p>
        )}
        {currentState === STATE_ANSWER && (
          <p className="text-lg">{answerText}</p>
        )}
        {currentState === STATE_REPORT_REASON && (
          <textarea
            className="w-full h-full p-3 font-medium rounded-md text-gray-700 bg-white placeholder-text-placeholder focus:ring-2 focus:ring-button-blue focus:border-transparent" // Ensure textarea has its own contrasting bg
            placeholder="Type your reason why this needs to be reported..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={5}
          />
        )}
        {currentState === STATE_ASK_QUESTION && ( // UI for Ask Question state
          <textarea
            className="w-full h-full p-3 rounded-md text-gray-700 bg-white placeholder-text-placeholder focus:ring-2 focus:ring-button-teal focus:border-transparent"
            placeholder="Type your question about this flashcard..."
            value={askText}
            onChange={(e) => setAskText(e.target.value)}
            rows={5}
          />
        )}
      </div>

      {/* Button Area */}
      <div className="flex gap-2 justify-start">
        {currentState === STATE_QUESTION && (
          <>
            <button onClick={handleViewAnswer} className={primaryButtonClasses}>
              View Answer
            </button>
            <button onClick={() => {
              setCurrentState(STATE_REPORT_REASON);
              setReportReason('');
            }} className={secondaryButtonClasses}>
              Report
            </button>
          </>
        )}
        {currentState === STATE_ANSWER && (
          <>
            <button onClick={handleFlip} className={tertiaryButtonClasses}>
              Flip
            </button>
            <button onClick={handleAsk} className={askButtonClasses}>
              Ask
            </button>
            <button onClick={() => {
                 setCurrentState(STATE_REPORT_REASON);
                 setReportReason('');
            }} className={secondaryButtonClasses}>
              Report
            </button>
          </>
        )}
        {currentState === STATE_REPORT_REASON && (
          <>
            <button onClick={handleBackFromReport} className={tertiaryButtonClasses}>
              Back
            </button>
            <button onClick={handleReportSubmit} className={`${secondaryButtonClasses} bg-button-blue hover:bg-blue-600`}> {/* Report button could be blue in this state */}
              Report
            </button>
          </>
        )}
        {currentState === STATE_ASK_QUESTION && ( // Buttons for Ask Question state
          <>
            <button onClick={handleBackFromAsk} className={tertiaryButtonClasses}>
              Back
            </button>
            <button onClick={handleSubmitQuestion} className={secondaryButtonClasses}>
              Submit Question
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Flashcard;