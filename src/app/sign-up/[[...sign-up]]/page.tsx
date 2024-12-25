// app/sign-in/page.tsx
import { SignUp } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center h-screen">
      <SignUp />
    </div>
  );
}
