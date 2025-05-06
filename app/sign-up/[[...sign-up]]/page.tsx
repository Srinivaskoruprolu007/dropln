import { SignUpForm } from "@/components/SignUpForm";

export default function SignUpPage() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <SignUpForm />
    </div>
  );
}
