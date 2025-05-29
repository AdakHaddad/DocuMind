"use client";

import { useEffect, useState } from "react";
import ModalTemplate from "@/src/components/modals/ModalTemplate";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { dashboard } from "@/src/utils/routes";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";

// Define the form data type
type SignInFormData = {
  email: string;
  password: string;
};

const LoadingIndicator = () => (
    <div className="flex flex-col w-full h-screen items-center justify-center bg-background text-foreground">
      <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-documind-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-xl text-documind-text-secondary font-semibold">Loading DocuMind...</p>
    </div>
  );

const SignIn = () => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

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

  const handleSignUp = () => {
    setIsLoading(true);
    router.push("/signup");
  };

  if (isLoading) {
    return <LoadingIndicator />;
  }

  return (
    <ModalTemplate
      content={
        <div className="flex flex-col items-center justify-center mb-2">
          <h1 className="text-5xl mb-3 font-bold font-inter">
            <span className="text-documind-text-primary">Docu</span>
            <span className="text-documind-primary">Mind</span>
          </h1>
          <p className="text-lg text-documind-text-secondary font-open-sans font-bold text-center leading-[1.2]">
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
              className="mb-3"
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
              className="mb-3"
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

            <div className="flex gap-4 mt-4">
              <Button size="sm" type="submit">
                Sign In
              </Button>
              <Button
                size="sm"
                onClick={handleSignUp}
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
