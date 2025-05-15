"use client";

import React from "react";

interface IModalTemplate {
  content: React.ReactNode;
  containerClass?: string;
  subcontent?: React.ReactNode;
  button?: React.ReactNode;
}

const ModalTemplate = ({
  content,
  subcontent,
  button,
  containerClass
}: IModalTemplate) => {
  return (
    <div className="flex flex-col items-center justify-center text-black">
      <div
        className={
          "flex flex-col items-center justify-center gap-[1.5vw] shadow-[-4px_4px_6px_0px_rgba(0,0,0,0.3)] " +
          (containerClass
            ? containerClass
            : "bg-documind-bg rounded-[2vw] p-[3vw]")
        }
      >
        <div className="flex flex-col items-center justify-center">
          {content}
          {subcontent}
        </div>
        {button}
      </div>
    </div>
  );
};

export default ModalTemplate;
