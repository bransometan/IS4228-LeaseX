"use client";

import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useEffect, useState } from "react";

const formSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(1, "Username must at least be 1 character"),
  firstName: z.string().min(1, "First name must be at least 1 character"),
  lastName: z.string().min(1, "Last name must be at least 1 character"),
});

export default function RegisterForm() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { toast } = useToast();
  const router = useRouter();
  const [ticket, setTicket] = useState<string | null>(null);

  useEffect(() => {
    const param = "__clerk_ticket";
    const ticketValue = new URL(window.location.href).searchParams.get(param);
    setTicket(ticketValue);
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      username: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!isLoaded || !ticket) {
      toast({ description: "Invalid invitation link or form not ready." });
      return;
    }

    const { password, username, firstName, lastName } = values;

    try {
      const res = await signUp.create({
        strategy: "ticket",
        ticket,
        password,
        username,
        firstName,
        lastName,
      });

      toast({
        title: "Success!",
        description: "Your information is received, hang on...",
      });

      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        toast({ title: "Welcome", description: "Enjoy LeaseX!" });
        router.push("/");
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      toast({
        title: "Error",
        description: "Registration failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white border rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-indigo-700">Complete Your Registration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your details to activate your LeaseX account.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. johndoe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Doe" {...field} />
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
                    <Input
                      type="password"
                      placeholder="At least 8 characters"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full mt-2">
              Confirm & Register
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
