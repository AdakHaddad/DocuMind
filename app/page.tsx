"use client";

import React from "react";

const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
      <h1 className="text-4xl font-bold mb-6 font-handwritten">DocuMind</h1>

      <div className="flex flex-col gap-3 w-80">
        <label className="text-sm font-bold">EMAIL</label>
        <input
          type="email"
          placeholder="Insert your email"
          className="border-2 border-black p-2 rounded-md"
        />

        <label className="text-sm font-bold">PASSWORD</label>
        <input
          type="password"
          placeholder="Insert your password"
          className="border-2 border-black p-2 rounded-md"
        />
      </div>

      <div className="flex gap-3 mt-4">
        <button className="bg-black text-white px-6 py-2 rounded-md text-lg">
          Sign In
        </button>
        <button className="border-2 border-black text-black px-6 py-2 rounded-md text-lg">
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default Home;
