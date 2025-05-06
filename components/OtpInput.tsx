"use client";

import React, { useState, useRef, KeyboardEvent, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface OtpInputProps {
  length?: number;
  onComplete: (otp: string) => void;
}

export function OtpInput({ length = 6, onComplete }: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  useEffect(() => {
    // Focus the first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (element: HTMLInputElement, index: number) => {
    const value = element.value;
    if (isNaN(Number(value))) return; // Only allow numbers

    const newOtp = [...otp];
    // Allow only one digit per input
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input if digit entered
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if OTP is complete
    if (newOtp.every((digit) => digit !== "")) {
      onComplete(newOtp.join(""));
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    // Move focus to previous input on backspace if current input is empty
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasteData = event.clipboardData
      .getData("text")
      .trim()
      .slice(0, length);
    if (/^\d+$/.test(pasteData)) {
      // Check if pasted data is only digits
      const newOtp = [...otp];
      for (let i = 0; i < length; i++) {
        if (i < pasteData.length) {
          newOtp[i] = pasteData[i];
        } else {
          newOtp[i] = ""; // Clear remaining fields if paste is shorter
        }
      }
      setOtp(newOtp);
      const lastFilledIndex = Math.min(pasteData.length - 1, length - 1);
      inputRefs.current[lastFilledIndex]?.focus();
      if (newOtp.every((digit) => digit !== "")) {
        onComplete(newOtp.join(""));
      }
    }
  };

  const handleReset = () => {
    setOtp(new Array(length).fill(""));
    inputRefs.current[0]?.focus();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <p className="text-center">
        Enter the verification code sent to your email.
      </p>
      <div className="flex justify-center space-x-2" onPaste={handlePaste}>
        {otp.map((data, index) => (
          <Input
            key={index}
            type="text"
            maxLength={1}
            value={data}
            onChange={(e) => handleChange(e.target as HTMLInputElement, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            ref={(el) => (inputRefs.current[index] = el)}
            className="w-12 h-12 text-center text-lg border rounded focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            style={{ MozAppearance: "textfield" }} // Hide spinners in Firefox
            inputMode="numeric" // Show numeric keyboard on mobile
            pattern="[0-9]*" // Pattern for numeric input
          />
        ))}
      </div>
      <Button variant="outline" onClick={handleReset}>
        Reset
      </Button>
    </div>
  );
}
