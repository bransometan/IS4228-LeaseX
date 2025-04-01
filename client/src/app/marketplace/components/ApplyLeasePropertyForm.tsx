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
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  applyLeaseProperty,
  getDepositAmountForLeasePropertyId,
  listLeaseProperty,
} from "@/services/leaseMarketplace";
import { useUser } from "@clerk/nextjs";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
  description: z.string().min(1, "Description must be at least 1 character"),
});

export default function ApplyLeasePropertyForm({
  leasePropertyId,
}: {
  leasePropertyId: number;
}) {
  const [depositFee, setDepositFee] = useState<number>();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { wallet } = useSelector((states: RootState) => states.globalStates);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    const getDepositFee = async () => {
      const depositFee = await getDepositAmountForLeasePropertyId(
        leasePropertyId
      );
      setDepositFee(depositFee);
    };
    getDepositFee();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phoneNumber: "",
      description: "",
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
      await applyLeaseProperty(
        leasePropertyId,
        user?.fullName as string,
        user?.primaryEmailAddress?.emailAddress as string,
        values.phoneNumber,
        values.description
      );
      form.reset();
      router.push("/applications");
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

  if (!depositFee) return;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <li className="hover:bg-gray-100 hover:cursor-pointer rounded px-2">
          Apply
        </li>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="space-y-2">
          <DialogTitle>Apply lease property</DialogTitle>
          <DialogDescription>
            Apply to be a tenant in this lease property!
          </DialogDescription>
          <DialogDescription>
            Tenant must initially{" "}
            <b>pay a deposit of {depositFee} XTokens</b> for the lease
            property to the PaymentEscrow contract. The deposit will be deducted
            once landlord accepts application. Deposit will be returned to the
            tenant if the lease application is rejected.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="py-2 px-2 space-y-4"
          >
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter description" {...field} />
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
