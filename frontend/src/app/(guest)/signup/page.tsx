"use client";

import ModalTemplate from "@/src/components/modals/ModalTemplate";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { signin } from "@/src/utils/routes";
import { signIn as LogUser } from "next-auth/react";

// Define the form data type
type SignUpFormData = {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
};

const SignUp = () => {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<SignUpFormData>(); // Use the type for form data
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Define the submit handler with the correct type
  const onSubmit: SubmitHandler<SignUpFormData> = async (data) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          username: data.username
        })
      });

      const result = await response.json();

      if (response.ok) {
        // User is successfully created
        alert("Sign-up successful!");

        // Now log the user in automatically after successful sign-up
        const res = await LogUser("credentials", {
          redirect: false,
          email: data.email,
          password: data.password
        });

        if (res?.error) {
          setErrorMessage("Sign-in failed. Please try again.");
        } else {
          // Sign-in was successful
          alert("Sign-in successful!");
        }
      } else {
        setErrorMessage(result.error || "Sign-up failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during sign-up:", error);
      setErrorMessage("There was an issue signing up. Please try again.");
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
        <div className="flex flex-col gap-1 w-full">
          <form onSubmit={handleSubmit(onSubmit)} className="w-full">
            <Input
              label="Username"
              type="text"
              id="username"
              placeholder="Insert your username"
              {...register("username", { required: "Username is required" })}
            />
            {errors.username && (
              <p className="text-red-500">{errors.username.message}</p>
            )}

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

            <Input
              label="Confirm Password"
              type="password"
              id="confirm_password"
              placeholder="Confirm your password"
              {...register("confirm_password", {
                required: "Confirm password is required",
                validate: (value) =>
                  value === watch("password") || "Passwords do not match"
              })}
            />
            {errors.confirm_password && (
              <p className="text-red-500">{errors.confirm_password.message}</p>
            )}

            {errorMessage && <p className="text-red-500">{errorMessage}</p>}

            <div className="flex gap-2 mt-4">
              <Button size="sm" type="submit">
                Sign Up
              </Button>
              <Button
                size="sm"
                onClick={() => router.push(signin)}
                type="button"
                variant="outline"
              >
                Sign In
              </Button>
            </div>
          </form>
        </div>
      }
    />
  );
};

export default SignUp;
