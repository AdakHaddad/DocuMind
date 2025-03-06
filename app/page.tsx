"use client";

import React from "react";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
      <h1 className="text-4xl font-bold mb-6 font-handwritten">DocuMind</h1>
      <h1 className="text-2xl font-light mb-6 font-handwritten">
        Platform Pembelajaran Efisien
      </h1>

      <div className="flex flex-col gap-3">
        <button className="bg-black text-white px-6 py-2 rounded-md text-lg">
          Sign In
        </button>
        <button className="border-2 border-black text-black px-6 py-2 rounded-md text-lg">
          Sign Up
        </button>
      </div>

      <div className="absolute bottom-6 flex gap-4">
        <button className="bg-black text-white px-4 py-2 rounded-md text-sm">
          Contact
        </button>
        <button className="bg-black text-white px-4 py-2 rounded-md text-sm">
          About Us
        </button>
        <button className="bg-black text-white px-4 py-2 rounded-md text-sm">
          Privacy Policy
        </button>
      </div>
    </div>
  );
};

export default Home;
