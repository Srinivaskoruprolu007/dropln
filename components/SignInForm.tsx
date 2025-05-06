"use client";
import { useSignIn } from "@clerk/nextjs";
import { signInSchema } from "@/schemas/signInSchema";
import Spinner from "./ui/Spinner"; // Import the Spinner component
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react"; // Added useEffect
import { z } from "zod";
import { useRouter } from "next/navigation";
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

export function SignInComponent() {
  const { signIn, isLoaded, setActive } = useSignIn(); // Added setActive
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authErrors, setAuthErrors] = useState<string | null>(null);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof signInSchema>) => {
    if (!isLoaded || !signIn) {
      return;
    }
    setIsSubmitting(true);
    setAuthErrors(null);

    try {
      const result = await signIn.create({
        identifier: values.email,
        password: values.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.push("/dashboard");
      } else {
        // Handle other potential statuses if needed, though typically sign-in is simpler
        console.error("Sign in status:", result.status);
        // For MFA/2FA, you might need additional steps here
        setAuthErrors("Sign in failed. Please check your credentials.");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setAuthErrors(
        err.errors?.[0]?.message ||
          "Sign in failed. Please check your credentials."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner size="big" />
      </div>
    );
  }

  // Don't render the form if already signed in (avoids flash of form)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {authErrors && (
          <p className="text-destructive text-sm font-medium bg-destructive/10 p-3 rounded-md">
            {authErrors}
          </p>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  {...field}
                />
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
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center items-center"
        >
          {isSubmitting ? <Spinner size="small" /> : "Sign In"}
        </Button>
      </form>
    </Form>
  );
}
