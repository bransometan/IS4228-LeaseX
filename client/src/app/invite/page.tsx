"use client";

import { Button } from "@/components/ui/button";
import React from "react";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UserRole } from "@/constants";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { capitalizeFirstLetter } from "@/lib/utils";

const formSchema = z.object({
  emailAddress: z.string().email("Please enter a valid email address."),
  role: z.nativeEnum(UserRole),
});

export default function InviteForm() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailAddress: "",
      role: UserRole.Landlord,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { emailAddress, role } = values;

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        body: JSON.stringify({ emailAddress, role }),
      });

      if (res.ok) {
        router.push("/invite/success");
      } else {
        toast({
          variant: "destructive",
          title: "Oops!",
          description: "Something went wrong while sending the invite.",
        });
        console.log(await res.json());
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not send invite. Please try again.",
      });
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md bg-white border rounded-xl shadow-lg p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-indigo-700">Send Role Invite</h1>
          <p className="text-sm text-gray-500">
            Invite someone to join LeaseX with a specific role.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="emailAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. user@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(UserRole).map((role, i) =>
                        role === UserRole.Admin ? null : (
                          <SelectItem key={i} value={role}>
                            {capitalizeFirstLetter(role)}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full mt-2">
              Send Invite
            </Button>
          </form>
        </Form>
      </div>
    </main>
  );
}
