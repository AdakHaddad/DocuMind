"use client";

import ModalTemplate from "@/src/components/ModalTemplate";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { dashboard } from "@/src/utils/routes";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";

// Define the form data type
type SignInFormData = {
  email: string;
  password: string;
};

const SignIn = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<SignInFormData>(); // Use the type for form data
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Define the submit handler with the correct type
  const onSubmit: SubmitHandler<SignInFormData> = async (data) => {
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password
      });

      if (res?.error) {
        setErrorMessage("Invalid email or password.");
      } else {
        // Sign-in was successful
        router.push(dashboard); // Redirect to dashboard or home on success
      }
    } catch (error) {
      console.error("Error during sign-in:", error);
      setErrorMessage("There was an issue signing in. Please try again.");
    }
  };

  return (
    <ModalTemplate
      content={
        <div className="flex flex-col items-center justify-center mb-2">
          <h1 className="text-2xl font-bold font-inter">
            <span className="text-documind-text-primary">Docu</span>
            <span className="text-documind-primary">Mind</span>
          </h1>
          <p className="text-sm text-documind-text-secondary font-open-sans font-bold text-center leading-[1.2]">
            <span>Your </span>
            <span className="text-documind-primary">best one-night-study</span>
            <br />
            <span>assistant!</span>
          </p>
        </div>
      }
      subcontent={
        <div className="flex flex-col gap-3 w-full">
          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <Input
              label="Email"
              type="email"
              id="email"
              placeholder="Insert your email"
              {...register("email", { required: "Email is required" })}
            />
            {errors.email && (
              <p className="text-red-500">{errors.email.message}</p>
            )}

            <Input
              label="Password"
              type="password"
              id="password"
              placeholder="Insert your password"
              {...register("password", { required: "Password is required" })}
            />
            {errors.password && (
              <p className="text-red-500">{errors.password.message}</p>
            )}

            {errorMessage && <p className="text-red-500">{errorMessage}</p>}

            <div className="flex gap-2 mt-4">
              <Button size="sm" type="submit">
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={() => router.push("/signup")}
                type="button"
                variant="outline"
              >
                Sign Up
              </Button>
            </div>
          </form>
        </div>
      }
    />
  );
};

export default SignIn;
