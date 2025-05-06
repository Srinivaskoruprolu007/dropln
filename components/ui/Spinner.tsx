import React from "react";

interface SpinnerProps {
  size?: "small" | "big";
}

const Spinner: React.FC<SpinnerProps> = ({ size = "big" }) => {
  const sizeClasses = size === "small" ? "h-5 w-5" : "h-8 w-8";
  const dotSizeClasses = size === "small" ? "h-1.5 w-1.5" : "h-2 w-2";

  return (
    <div
      className={`relative flex items-center justify-center ${sizeClasses}`}
      role="status"
      aria-live="polite"
    >
      <span
        className={`absolute block ${dotSizeClasses} rounded-full bg-primary animate-bounce`}
        style={{ animationDuration: "1s" }}
      ></span>
    </div>
  );
};

export default Spinner;
