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
import { unlistLeaseProperty } from "@/services/leaseMarketplace";
import { useState } from "react";

export default function UnlistLeasePropertyDialog({
  leasePropertyId,
}: {
  leasePropertyId: number;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  async function handleUnlist() {
    try {
      await unlistLeaseProperty(leasePropertyId);
      toast({
        title: "Success",
        description: "Lease property successfully unlisted",
      });
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
          Unlist
        </li>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Unlist Lease Property</DialogTitle>
          <DialogDescription>
            Are you sure? This unlists the lease property from the marketplace.{" "}
            <b>
              Note: you cannot unlist a lease property once there are
              applications.
            </b>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleUnlist}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
