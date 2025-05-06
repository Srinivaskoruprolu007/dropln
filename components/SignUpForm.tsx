"use client";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useSignUp } from "@clerk/nextjs";

import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signUpSchema } from "@/schemas/signUpSchema";
import { OtpInput } from "./OtpInput"; // Import the OTP input component
import { useRouter } from "next/navigation";

export function SignUpForm() {
  const router = useRouter();
  const [verifying, setVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authErrors, setAuthErrors] = useState<string | null>(null);
  // Remove otp state, it will be passed directly
  // const [otp, setOtp] = useState("");
  const [verificationErrors, setVerificationErrors] = useState<string | null>(
    null
  );

  const { signUp, setActive, isLoaded } = useSignUp();

  // Use the full form object from useForm
  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  // Modify handleVerificationSubmit to accept the OTP code
  const handleVerificationSubmit = async (code: string) => {
    // Remove e.preventDefault(); as it's not an event handler anymore
    if (!isLoaded || !signUp) {
      return;
    }
    setIsSubmitting(true);
    setVerificationErrors(null); // Clear previous verification errors
    setAuthErrors(null); // Also clear auth errors if any
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: code, // Use the passed code
      });
      console.log(result);
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        // Handle other statuses like 'expired'
        console.error("Verification failed", result.status);
        setVerificationErrors(`Verification failed: ${result.status}. Please try again.`);
      }
    } catch (error: any) {
      console.error(JSON.stringify(error, null, 2));
      setVerificationErrors(
        error.errors?.[0]?.message || "Verification failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof signUpSchema>) => {
    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    console.log(values);
    if (!isLoaded) {
      return;
    }
    setIsSubmitting(true);
    setAuthErrors(null);

    try {
      // Start the sign-up process
      const result = await signUp.create({
        emailAddress: values.email,
        password: values.password,
      });

      // If email verification is required
      if (result.status === "missing_requirements") {
        // Send the email verification code
        await signUp.prepareEmailAddressVerification({
          strategy: "email_code",
        });
        setVerifying(true); // Move to OTP verification step
      } else {
        // Sign up was successful, set the active session
        await setActive({ session: result.createdSessionId });
        // Potentially redirect the user or update UI
        console.log("Sign up successful, session active");
        router.push("/dashboard"); // Redirect after successful sign up without verification
      }
    } catch (err: any) {
      // Handle errors (e.g., display error message)
      console.error(JSON.stringify(err, null, 2));
      // You might want to use a toast notification library here
      setAuthErrors(err.errors?.[0]?.message || "Sign up failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP verification
  if (verifying) {
    // Render OTP input component when verifying
    return (
      <div>
        <h2>Verify your email</h2>
        <p>Enter the code sent to your email address.</p>
        {/* Pass the handleVerificationSubmit function to onComplete */}
        <OtpInput onComplete={handleVerificationSubmit} />
        {verificationErrors && (
          <p className="text-destructive text-sm mt-2">{verificationErrors}</p>
        )}
        {isSubmitting && <p>Verifying...</p>}
      </div>
    );
  }

  // Render the sign-up form initially
  // Pass the form object to the Form component
  return (
    <Form {...form}>
      {/* Use form.handleSubmit for submission */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {authErrors && (
          <p className="text-destructive text-sm">{authErrors}</p>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="your.email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="passwordConfirmation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing Up..." : "Sign Up"}
        </Button>
      </form>
    </Form>
  );
}
