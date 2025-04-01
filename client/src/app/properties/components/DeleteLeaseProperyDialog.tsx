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
import { deleteLeasePropertyById } from "@/services/leaseProperty";
import { useState } from "react";

export default function DeleteLeasePropertyDialog({
  leasePropertyId,
}: {
  leasePropertyId: number;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  async function handleDelete() {
    try {
      await deleteLeasePropertyById(leasePropertyId);
      toast({
        title: "Success",
        description: "Lease property successfully deleted",
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
          Delete
        </li>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Lease Property</DialogTitle>
          <DialogDescription>
            Are you sure? This deletes all information on the lease property.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleDelete}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
