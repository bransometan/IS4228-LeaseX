"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function InviteSuccess() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-lg border rounded-xl max-w-md w-full p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold text-green-600">🎉 Invite Sent!</h1>
        <p className="text-gray-600">
          An invitation email has been sent. Please ask the recipient to check their inbox and follow the instructions.
        </p>
        <Button className="w-full" onClick={() => router.push("/")}>
          Back to Home
        </Button>
      </div>
    </main>
  );
}
