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
import { useToast } from "@/components/ui/use-toast";
import { makePayment } from "@/services/leaseMarketplace";
import { LeaseApplicationStruct, LeasePropertyStruct } from "@/types/structs";
import { useState } from "react";

export default function MakePaymentDialog({
  leaseProperty,
  application,
}: {
  leaseProperty: LeasePropertyStruct;
  application: LeaseApplicationStruct;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  async function handlePayment() {
    try {
      await makePayment(
        leaseProperty.leasePropertyId,
        application.applicationId
      );
      toast({
        title: "Success",
        description: "Lease payment successfully made",
      });
      window.location.reload(); // Update state since payment is made
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
          Make Payment
        </li>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Make Lease Payment</DialogTitle>
          <DialogDescription>
            You will be making a payment of{" "}
            <b>{leaseProperty.leasePrice} XTokens</b>. After this you
            will have{" "}
            <b>
              {leaseProperty.leaseDuration - application.monthsPaid - 1}{" "}
              payments left
            </b>
            . Please note that you need to wait for the landlord to{" "}
            <b>accept payment</b> before it is reflected in the system under{" "}
            <b>Months Paid</b>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handlePayment}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
