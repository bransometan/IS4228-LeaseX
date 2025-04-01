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
  acceptLeaseApplication,
  getDepositAmountForLeasePropertyId,
} from "@/services/leaseMarketplace";
import { useEffect, useState } from "react";

export default function AcceptLeaseApplicationDialog({
  leasePropertyId,
  applicationId,
}: {
  leasePropertyId: number;
  applicationId: number;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const [depositFee, setDepositFee] = useState<number>();

  useEffect(() => {
    const getDepositFee = async () => {
      const depositFee = await getDepositAmountForLeasePropertyId(
        leasePropertyId
      );
      setDepositFee(depositFee);
    };
    getDepositFee();
  }, []);

  async function handleAccept() {
    try {
      await acceptLeaseApplication(leasePropertyId, applicationId);
      toast({
        title: "Success",
        description: "Lease application successfully accepted",
      });
      window.location.reload(); // Update state since application is accepted
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
          Accept
        </li>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Accept Lease Application</DialogTitle>
          <DialogDescription>
            The deposit fee of <b>{depositFee} XTokens</b> provided by the
            prospective tenant will be released to you once you accept this
            lease application.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleAccept}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
