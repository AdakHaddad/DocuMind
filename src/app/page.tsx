"use client";

import React from "react";
<<<<<<< HEAD
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";

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
      <Footer />
=======

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
>>>>>>> b3116f6cfa86f83fee71b45b75d25fd4c07fd2f0
    </div>
  );
};

export default Home;
