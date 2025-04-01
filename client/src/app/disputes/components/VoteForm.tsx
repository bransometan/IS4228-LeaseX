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
import { Vote } from "@/types/structs";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { RootState } from "@/types/state";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { voteOnLeaseDispute } from "@/services/leaseDisputeDAO";

const formSchema = z.object({
  vote: z.nativeEnum(Vote),
});

export default function VoteForm({ disputeId }: { disputeId: number }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { wallet } = useSelector((states: RootState) => states.globalStates);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      vote: Vote.VOID,
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
      await voteOnLeaseDispute(disputeId, values.vote);
      toast({
        title: "Success",
        description: "Voted on dispute successfully",
      });
      form.reset();
      window.location.reload();
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
          Vote
        </li>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Vote on dispute</DialogTitle>
          <DialogDescription>
            Note: you are <b>only allowed to vote once</b> on this dispute.
          </DialogDescription>
          <DialogDescription>
            You will be required to stake the vote price of <b>1 XToken</b>{" "}
            to the PaymentEscrow for the dispute. The dispute is valid for{" "}
            <b>7 days</b>. PaymentEscrow will hold the vote price until the
            dispute is resolved.
          </DialogDescription>
          <DialogDescription>
            <b>
              The dispute will be resolved if 1: the minimum of 2 votes is
              reached
            </b>{" "}
            or <b>2: the dispute has passed 7 days</b>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="py-2 px-2 space-y-4"
          >
            <FormField
              control={form.control}
              name="vote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vote</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vote" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(Vote).map((vote, i) => {
                        return (
                          <SelectItem key={i} value={vote}>
                            {vote}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                    <FormMessage />
                  </Select>
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
