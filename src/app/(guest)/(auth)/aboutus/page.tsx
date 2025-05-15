"use client";

import ModalTemplate from "@/src/components/modals/ModalTemplate";
import React from "react";
import Image from "next/image";

const AboutUs = () => {
  type AboutUsCard = {
    title: string;
    name: string;
    image?: string;
  };

  const cards: AboutUsCard[] = [
    {
      title: "Project Manager",
      name: "Yitzhak E.T.M",
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

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-2xl font-bold font-inter">
        <span className="text-documind-text-primary">About </span>
        <span className="text-documind-primary">Us</span>
      </h1>
      <div className="flex gap-2">
        {cards.map((card, index) => (
          <ModalTemplate
            key={index}
            content={
              <div className="flex flex-col text-center items-center">
                <div className="rounded-full aspect-[1/1] w-[15vw] overflow-clip relative mb-2">
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
                <h1 className="text-xl font-bold font-inter">
                  <span className="text-documind-text-primary">
                    {card.title}
                  </span>
                </h1>
                <h2 className="text-sm text-documind-text-primary font-bold font-inter">
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
