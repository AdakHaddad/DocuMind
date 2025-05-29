"use client";

import { useEffect, useState } from "react";
import ModalTemplate from "@/src/components/modals/ModalTemplate";
import React from "react";
import Image from "next/image";

const AboutUs = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  type AboutUsCard = {
    title: string;
    name: string;
    image?: string;
  };

  const cards: AboutUsCard[] = [
    {
      title: "Project Manager",
      name: "Yitzhak Edmund T.M",
      image: "https://avatars.githubusercontent.com/u/102123648?v=4"
    },
    {
      title: "Project Manager",
      name: "Muh. Muqtada Al Haddad",
      image: "https://avatars.githubusercontent.com/u/102123648?v=4"
    },
    {
      title: "Project Manager",
      name: "Ramadhani Feb.",
      image: "https://avatars.githubusercontent.com/u/102123648?v=4"
    }
  ];

  const LoadingIndicator = () => (
    <div className="flex flex-col w-full h-screen items-center justify-center bg-background text-foreground">
      <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-documind-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-xl text-documind-text-secondary font-semibold">Loading DocuMind...</p>
    </div>
  );

  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-4xl mb-6 font-bold font-inter">
        <span className="text-documind-text-primary">About </span>
        <span className="text-documind-primary">Us</span>
      </h1>
      <div className="flex gap-8">
        {cards.map((card, index) => (
          <ModalTemplate
            key={index}
            content={
              <div className="flex flex-col text-center items-center">
                <div className="rounded-full aspect-[1/1] w-[15vw] overflow-clip relative mb-4">
                  <Image
                    src={
                      card?.image
                        ? card.image
                        : "https://avatars.githubusercontent.com/u/102123648?v=4"
                    }
                    alt={card.name}
                    fill
                  />
                </div>
                <h1 className="text-2xl mb-2 font-bold font-inter">
                  <span className="text-documind-text-primary">
                    {card.title}
                  </span>
                </h1>
                <h2 className="text-md text-documind-text-primary font-bold font-inter">
                  {card.name}
                </h2>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
};

export default AboutUs;
