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
import {
  cancelOrRejectLeaseApplication,
  getDepositAmountForLeasePropertyId,
} from "@/services/leaseMarketplace";
import { useEffect, useState } from "react";

export default function CancelLeaseApplicationDialog({
  leasePropertyId,
  applicationId,
}: {
  leasePropertyId: number;
  applicationId: number;
}) {
  const [depositFee, setDepositFee] = useState<number>();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const getDepositFee = async () => {
      const depositFee = await getDepositAmountForLeasePropertyId(
        leasePropertyId
      );
      setDepositFee(depositFee);
    };
    getDepositFee();
  }, []);

  async function handleCancel() {
    try {
      await cancelOrRejectLeaseApplication(leasePropertyId, applicationId);
      toast({
        title: "Success",
        description: "Lease application successfully cancelled",
      });
      window.location.reload(); // Update state since application is deleted
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
          Cancel
        </li>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Cancel Lease Application</DialogTitle>
          <DialogDescription>
            Are you sure? This will cancel the current lease application.
            Tenant will be <b>refunded the deposit {depositFee} XTokens</b>
            .
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleCancel}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
