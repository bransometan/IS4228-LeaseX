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
  emailAddress: z.string().email(),
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

  // Send the role invite
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { emailAddress, role } = values;

    try {
      const roleInviteData = {
        emailAddress,
        role,
      };
      const res = await fetch("/api/organizations", {
        method: "POST",
        body: JSON.stringify(roleInviteData),
      });
      if (res.ok) {
        router.push("/invite/success");
      } else {
        toast({
          variant: "destructive",
          title: "Oops",
          description: "Something went wrong!",
        });
        console.log(res.json());
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <div className="mx-20 space-y-4">
      <h1 className="text-2xl font-bold text-center">Role Invitation</h1>
      <p className="text-muted-foreground text-center">
        An email will be sent for you to enter LeaseX as the stated role
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="emailAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="Enter email address" {...field} />
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
                    {Object.values(UserRole).map((role, i) => {
                      if (role === UserRole.Admin) return;
                      return (
                        <SelectItem key={i} value={role}>
                          {capitalizeFirstLetter(role)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                  <FormMessage />
                </Select>
              </FormItem>
            )}
          />
          <Button type="submit">Confirm</Button>
        </form>
      </Form>
    </div>
  );
}
