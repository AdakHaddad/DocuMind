"use client";

import ModalTemplate from "@/components/ModalTemplate";
import { Button } from "@/components/ui/button";
import React from "react";

const Template = () => {
  return (
    <ModalTemplate
      content={
        <p className="text-[3vw] text-documind-text-primary font-inter">
          {"<content>"}
        </p>
      }
      subcontent={
        <p className="text-[2vw] text-documind-text-secondary font-open-sans">
          {"<sub-content here>"}
        </p>
      }
      button={<Button size={"lg"}>{"<welcome>"}</Button>}
    />
  );
};

export default Template;
