"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { convertXTokenToETH, getXToken } from "@/services/xToken";
import { RootState } from "@/types/state";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { z } from "zod";

const xTokenFormSchema = z.object({
  valueInEth: z.coerce.number().positive("Eth must be > 0"),
});

const SwapXTokensForm = () => {
  const { wallet } = useSelector((states: RootState) => states.globalStates);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof xTokenFormSchema>>({
    resolver: zodResolver(xTokenFormSchema),
    defaultValues: {
      valueInEth: 1,
    },
  });

  async function onSubmit(values: z.infer<typeof xTokenFormSchema>) {
    if (!wallet) {
      toast({
        description: "Please connect to your wallet!",
      });
      return;
    }
    try {
      await getXToken(values.valueInEth);
      toast({
        title: "Success!",
        description: `Swapped ${values.valueInEth} ETH for ${
          values.valueInEth * 100
        } XToken`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Oops",
        description: "Something went wrong",
      });
      console.error(error);
    }
  }

  return (
    <Card className="shadow-xl rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Convert ETH to XToken</CardTitle>
        <CardDescription className="whitespace-nowrap">1 ETH = 100 XToken | Required for LeaseX usage</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="valueInEth"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-2 gap-6 items-center">
                    <div>
                      <FormLabel className="font-medium text-sm">ETH</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter ETH" {...field} />
                      </FormControl>
                    </div>
                    <div>
                      <FormLabel className="font-medium text-sm">XToken</FormLabel>
                      <Input
                        readOnly
                        className="bg-gray-100"
                        value={form.getValues().valueInEth * 100}
                        onChange={(e) =>
                          form.setValue(
                            "valueInEth",
                            parseInt(e.currentTarget.value || "0") / 100
                          )
                        }
                      />
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full mt-2" type="submit">Swap ETH ➝ XToken</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

const ethFormSchema = z.object({
  valueInXToken: z.coerce.number().positive("Lease token must be > 0"),
});

const SwapEthForm = () => {
  const { wallet } = useSelector((states: RootState) => states.globalStates);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof ethFormSchema>>({
    resolver: zodResolver(ethFormSchema),
    defaultValues: {
      valueInXToken: 100,
    },
  });

  async function onSubmit(values: z.infer<typeof ethFormSchema>) {
    if (!wallet) {
      toast({
        description: "Please connect to your wallet!",
      });
      return;
    }
    try {
      await convertXTokenToETH(values.valueInXToken);
      toast({
        title: "Success!",
        description: `Swapped ${values.valueInXToken} XToken for ${
          values.valueInXToken / 100
        } ETH`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Oops",
        description: "Something went wrong",
      });
      console.error(error);
    }
  }

  return (
    <Card className="shadow-xl rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Convert XToken to ETH</CardTitle>
        <CardDescription className="whitespace-nowrap">100 XToken = 1 ETH | Withdraw back to ETH</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="valueInXToken"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-2 gap-6 items-center">
                    <div>
                      <FormLabel className="font-medium text-sm">XToken</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter XToken" {...field} />
                      </FormControl>
                    </div>
                    <div>
                      <FormLabel className="font-medium text-sm">ETH</FormLabel>
                      <Input
                        readOnly
                        className="bg-gray-100"
                        value={form.getValues().valueInXToken / 100}
                        onChange={(e) =>
                          form.setValue(
                            "valueInXToken",
                            parseInt(e.currentTarget.value || "0") * 100
                          )
                        }
                      />
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full mt-2" type="submit">Swap XToken ➝ ETH</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default function Home() {
  const router = useRouter();
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-gray-50">
      <div className="max-w-3xl w-full space-y-10 text-center">
        <section className="space-y-4">
          <h1 className="text-5xl font-extrabold text-indigo-700">LeaseX</h1>
          <p className="text-gray-600 text-lg">
            Unlocking Property Lease Freedom: Empowering Decentralized Leases with Blockchain
          </p>
          <SignedOut>
            <div className="space-x-4 mt-4">
              <SignInButton>
                <Button>Log In</Button>
              </SignInButton>
              <Button variant="outline" onClick={() => router.push("/invite")}>Sign Up</Button>
            </div>
          </SignedOut>
        </section>
        <SignedIn>
          <section className="grid md:grid-cols-2 gap-8">
            <SwapXTokensForm />
            <SwapEthForm />
          </section>
        </SignedIn>
      </div>
    </main>
  );
}
