"use client";

import ModalTemplate from "@/src/components/ModalTemplate";
import React from "react";

const PrivacyPolicy = () => {
  type PrivacyPolicyContent = {
    id: number;
    title: string;
    contents: {
      id: string;
      title: string;
      content: string;
    }[];
  };

  const privacyPolicyContent: PrivacyPolicyContent[] = [
    {
      id: 1,
      title: "Introduction",
      contents: [
        {
          id: "a",
          title: "What is this Privacy Policy?",
          content:
            "This Privacy Policy describes how we handle your personal information when you use our services."
        },
        {
          id: "b",
          title: "What information do we collect?",
          content:
            "We collect information about you when you use our services, including your name, email address, and usage data."
        },
        {
          id: "c",
          title: "How do we use your information?",
          content:
            "We use your information to provide and improve our services, communicate with you, and comply with legal obligations."
        }
      ]
    },
    {
      id: 2,
      title: "Data Sharing",
      contents: [
        {
          id: "a",
          title: "Do we share your information?",
          content:
            "We do not share your personal information with third parties without your consent, except as required by law."
        },
        {
          id: "b",
          title: "How do we protect your information?",
          content:
            "We take reasonable measures to protect your personal information from unauthorized access, use, or disclosure."
        }
      ]
    },
    {
      id: 3,
      title: "Your Rights",
      contents: [
        {
          id: "a",
          title: "What rights do you have?",
          content:
            "You have the right to access, correct, or delete your personal information. You also have the right to object to or restrict our processing of your personal information."
        },
        {
          id: "b",
          title: "How can you exercise your rights?",
          content:
            "You can exercise your rights by contacting us using the contact information provided below."
        }
      ]
    }
  ];

  return (
    <ModalTemplate
      containerClass="bg-documind-bg rounded-2xl p-4 w-fit h-[78vh] overflow-clip"
      content={
        <div className="flex overflow-clip h-full">
          <div className="flex flex-col gap-3 w-full h-[75vh] text-documind-text-primary p-4 overflow-y-scroll">
            <h1 className="text-xl font-bold font-inter">
              <span className="text-documind-text-primary">Privacy </span>
              <span className="text-documind-primary">Policy</span>
            </h1>

            {privacyPolicyContent.map((section) => (
              <div key={section.id} className="flex flex-col gap-2">
                <h2 className="text-lg font-bold font-inter">
                  {section.title}
                </h2>
                {section.contents.map((content) => (
                  <div key={content.id} className="flex flex-col gap-1">
                    <h3 className="text-md font-semibold font-inter">
                      {content.title}
                    </h3>
                    <p className="text-sm font-normal font-open-sans">
                      {content.content}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      }
    />
  );
};

export default PrivacyPolicy;
