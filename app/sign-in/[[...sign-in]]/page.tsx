import { SignInComponent } from "@/components/SignInForm";

export default function SignInPage() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <SignInComponent />
    </div>
  );
}
