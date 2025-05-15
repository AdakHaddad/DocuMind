"use client";

import Header from "@/src/components/Header";
import Questions from "@/src/components/pages/Questions";
import React from "react";

const QuestionsPage = () => {
  const handleBackClick = () => {
    // Implement back button functionality here
    console.log("Back button clicked");
  };

  const handleRenameClick = () => {
    // Implement rename button functionality here
    console.log("Rename button clicked");
  };

  const handleDeleteClick = () => {
    // Implement delete button functionality here
    console.log("Delete button clicked");
  };

  return (
    <div className="flex flex-col w-full h-full items-center justify-center relative">
      <Header>
        <div className="flex items-center justify-between w-full px-4">
          <div className="flex gap-2">
            <button
              onClick={handleBackClick}
              className="bg-red-500 text-white px-2 py-1 rounded-md"
            >
              &lt;&lt; Back
            </button>
            <p className="flex-grow text-center text-lg font-semibold">
              Modul 1 • Pembentukan Kelompok & Perumusan Masalah.pdf
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRenameClick}
              className="bg-blue-500 text-white px-2 py-1 rounded-md"
            >
              Rename
            </button>
            <button
              onClick={handleDeleteClick}
              className="bg-red-500 text-white px-2 py-1 rounded-md"
            >
              Delete
            </button>
          </div>
        </div>
      </Header>
      <Questions />
    </div>
  );
};

export default QuestionsPage;
