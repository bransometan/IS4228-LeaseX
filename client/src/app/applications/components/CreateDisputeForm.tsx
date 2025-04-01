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
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DisputeType } from "@/types/structs";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { RootState } from "@/types/state";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createLeaseDispute } from "@/services/leaseDisputeDAO";

const formSchema = z.object({
  disputeType: z.nativeEnum(DisputeType),
  disputeReason: z
    .string()
    .min(1, "Dispute reason must be at least 1 character"),
});

export default function CreateDisputeForm({
  leasePropertyId,
  applicationId,
}: {
  leasePropertyId: number;
  applicationId: number;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { wallet } = useSelector((states: RootState) => states.globalStates);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      disputeType: DisputeType.MAINTENANCE_AND_REPAIRS,
      disputeReason: "",
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
      await createLeaseDispute(
        leasePropertyId,
        applicationId,
        values.disputeType,
        values.disputeReason
      );
      toast({
        title: "Success",
        description: "Created lease dispute successfully",
      });
      form.reset();
      router.push("/disputes");
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
          Dispute
        </li>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create dispute on lease property</DialogTitle>
          <DialogDescription>
            For issues during your lease duration. You will be required to stake
            a voter reward of <b>50 XTokens</b> to the PaymentEscrow for
            the dispute, as reward for <b>validators</b>. PaymentEscrow will
            hold the voter reward until the dispute is resolved. The dispute is
            valid for <b>7 days</b>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="py-2 px-2 space-y-4"
          >
            <FormField
              control={form.control}
              name="disputeType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dispute Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a dispute type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(DisputeType).map((disputeType, i) => {
                        return (
                          <SelectItem key={i} value={disputeType}>
                            {disputeType}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                    <FormMessage />
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="disputeReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dispute Reason</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter dispute reason" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                variant="ghost"
                type="button"
                onClick={() => setOpen(false)}
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
