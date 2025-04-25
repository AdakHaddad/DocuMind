"use client";

import { useRouter } from "next/navigation";
import MainFooter from "../components/MainFooter";
import ModalTemplate from "../components/ModalTemplate";
import { Button } from "../components/ui/button";
import { signin, signup } from "../utils/routes";

const Home = () => {
  const router = useRouter();

  return (
    <div className="flex w-full h-full items-center justify-center">
      <ModalTemplate
        content={
          <div className="flex flex-col items-center justify-center mb-4">
            <h1 className="text-4xl font-bold font-inter">
              <span className="text-documind-text-primary">Docu</span>
              <span className="text-documind-primary">Mind</span>
            </h1>
            <p className="text-documind-text-secondary font-open-sans font-bold text-center leading-5">
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
          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={() => router.push(signin)}>
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => router.push(signup)}
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
