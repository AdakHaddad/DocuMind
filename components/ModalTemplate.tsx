"use client";

import React from "react";

interface IModalTemplate {
  content: React.ReactNode;
  subcontent: React.ReactNode;
  button: React.ReactNode;
}

const ModalTemplate = ({ content, subcontent, button }: IModalTemplate) => {
  return (
    <div className="flex flex-col items-center justify-center bg-white text-black w-full">
      <div className="flex flex-col items-center justify-center gap-[1.5vw] shadow-[-4px_4px_6px_0px_rgba(0,0,0,0.3)] rounded-[2vw] p-[3vw]">
        <div className="flex flex-col items-center justify-center bg-documind-card-bg">
          {content}
          {subcontent}
        </div>
        {button}
      </div>
    </div>
  );
};

export default ModalTemplate;
