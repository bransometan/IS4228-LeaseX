import { SignIn } from "@clerk/nextjs";
import React from "react";

export default function Login() {
  return (
    <div className="flex justify-center">
      <SignIn path="/login" afterSignInUrl="/" />
    </div>
  );
}
