"use client";

import React from "react";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center bg-white text-black w-full">
      <div className="flex flex-col items-center justify-center gap-[1.5vw] shadow-[-4px_4px_6px_0px_rgba(0,0,0,0.3)] rounded-[2vw] p-[3vw]">
        <div className="flex flex-col items-center justify-center bg-documind-card-bg">
          <p className="text-[3vw] text-documind-text-primary font-inter">
            {"<content>"}
          </p>
          <p className="text-[2vw] text-documind-text-secondary font-open-sans">
            {"<sub-content here>"}
          </p>
        </div>
        <div className="text-[2vw] bg-documind-primary text-documind-card-bg py-[.5vw] px-[2vw] rounded-[1vw] font-open-sans">
          {"<welcome>"}
        </div>
      </div>
    </div>
  );
};

export default Home;
