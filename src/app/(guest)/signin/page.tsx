"use client";

import ModalTemplate from "@/src/components/ModalTemplate";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import React from "react";

const SignIn = () => {
  return (
    <ModalTemplate
      content={
        <div className="flex flex-col items-center justify-center mb-4">
          <h1 className="text-4xl font-bold font-inter">
            <span className="text-documind-text-primary">Docu</span>
            <span className="text-documind-primary">Mind</span>
          </h1>
          <p className="text-documind-text-secondary font-open-sans font-bold text-center leading-5">
            <span>Your </span>
            <span className="text-documind-primary">best one-night-study</span>
            <br />
            <span>assistant!</span>
          </p>
        </div>
      }
      subcontent={
        <div className="flex flex-col gap-3 w-full">
          <Input
            label="Email"
            type="email"
            id="email"
            placeholder="Insert your email"
          />

          <Input
            label="Password"
            type="password"
            id="password"
            placeholder="Insert your password"
          />
        </div>
      }
      button={
        <div className="flex gap-2">
          <Button size="sm">Sign In</Button>
          <Button size="sm" variant="outline">
            Sign Up
          </Button>
        </div>
      }
    />
  );
};

export default SignIn;
