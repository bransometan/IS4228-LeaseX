import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { RootState } from "@/types/state";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { listLeaseProperty } from "@/services/leaseMarketplace";

const formSchema = z.object({
  depositFee: z.coerce.number().positive("Deposit fee must be greater than 0"),
});

export default function ListLeasePropertyDialog({
  leasePropertyId,
}: {
  leasePropertyId: number;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { wallet } = useSelector((states: RootState) => states.globalStates);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      depositFee: 1,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!wallet) {
      toast({
        description: "Please connect to your wallet!",
      });
      return;
    }
    try {
      await listLeaseProperty(leasePropertyId, values.depositFee);
      setOpen(false);
      router.push("/marketplace");
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Oops",
        description: "Something went wrong",
      });
    } finally {
      setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <li className="hover:bg-gray-100 hover:cursor-pointer rounded px-2">
          List
        </li>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="space-y-2">
          <DialogTitle>List Lease Property</DialogTitle>
          <DialogDescription>
            This will list your lease property on the marketplace.
          </DialogDescription>
          <DialogDescription>
            You are also required to pay a
            <b> one-time protection fee of 50 XTokens </b>to our Payment
            Escrow in order to list the lease property. This is used in event
            of dispute.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="py-2 px-2 space-y-4"
          >
            <FormField
              control={form.control}
              name="depositFee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deposit Fee</FormLabel>
                  <FormDescription>
                    A one-time deposit fee (in XTokens) for tenants to
                    stake during lease application in the event of dispute.
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder="Enter deposit fee"
                      {...field}
                      type="number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button type="submit">Confirm</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
