"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import MainFooter from "../components/MainFooter";
import ModalTemplate from "../components/modals/ModalTemplate";
import { Button } from "../components/ui/button";
import { signin, signup } from "../utils/routes";

const Home = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const LoadingIndicator = () => (
    <div className="flex flex-col w-full h-screen items-center justify-center bg-background text-foreground">
      <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-documind-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-xl text-documind-text-secondary font-semibold">Loading DocuMind...</p>
    </div>
  );

  const handleSignIn = () => {
    setIsLoading(true);
    router.push(signin);
  };

  const handleSignUp = () => {
    setIsLoading(true);
    router.push(signup);
  };

  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <div className="flex w-full h-full items-center justify-center">
      <ModalTemplate
        content={
          <div className="flex flex-col items-center justify-center mb-4">
            <h1 className="text-5xl mb-3 font-bold font-inter">
              <span className="text-documind-text-primary">Docu</span>
              <span className="text-documind-primary">Mind</span>
            </h1>
            <p className="text-lg text-documind-text-secondary font-open-sans font-bold text-center leading-5">
              <span>Your </span>
              <span className="text-documind-primary">
                best one-night-study
              </span>
              <br />
              <span>assistant!</span>
            </p>
          </div>
        }
        button={
          <div className="flex flex-col gap-2 text-xl">
            <Button className="mb-2" size="sm" onClick={handleSignIn}>
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={handleSignUp}
              variant="outline"
            >
              Sign Up
            </Button>
          </div>
        }
      />
      <MainFooter />
    </div>
  );
};

export default Home;
