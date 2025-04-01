import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DisputeStatus, LeaseDisputeStruct } from "@/types/structs";
import { CircleEllipsis } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { checkUserRole, formatDateForDispute, truncate } from "@/lib/utils";
import { useSession } from "@clerk/nextjs";
import { UserRole } from "@/constants";
import VoteForm from "./VoteForm";
import { useEffect, useState } from "react";
import { getNumVotersInDispute } from "@/services/leaseDisputeDAO";

const LeaseApplicationActionsDropdown = ({
  disputeId,
}: {
  disputeId: number;
}) => {
  return (
    <Popover>
      <PopoverTrigger className="absolute right-1 top-1">
        <CircleEllipsis color="gray" />
      </PopoverTrigger>
      <PopoverContent className="text-sm absolute right-0 top-0 w-[100px]">
        <div>
          <ul className="space-y-1">
            <VoteForm disputeId={disputeId} />
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function DisputeCard({
  leaseDispute,
}: {
  leaseDispute: LeaseDisputeStruct;
}) {
  const { session } = useSession();
  const role = checkUserRole(session);
  const [numVoters, setNumVoters] = useState<number>();

  useEffect(() => {
    const getNumVoters = async () => {
      const numVoters = await getNumVotersInDispute(leaseDispute.leaseDisputeId);
      setNumVoters(numVoters);
    };
    getNumVoters();
  }, []);

  return (
    <Card>
      <CardHeader className="font-bold relative">
        {role === UserRole.Validator &&
          leaseDispute.status === DisputeStatus.PENDING && (
            <LeaseApplicationActionsDropdown
              disputeId={leaseDispute.leaseDisputeId}
            />
          )}
        <CardTitle>Application Id: {leaseDispute.applicationId}</CardTitle>
        <CardTitle>
          Lease Property Id: {leaseDispute.leasePropertyId}
        </CardTitle>
        <CardDescription className="font-normal">
          Valid from: {formatDateForDispute(leaseDispute.startTime)} -{" "}
          {formatDateForDispute(leaseDispute.endTime)}
        </CardDescription>
        <CardDescription className="text-md">
          Dispute type: {leaseDispute.disputeType}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>Reason: {leaseDispute.disputeReason}</p>
        <hr />
        <ul className="text-sm text-muted-foreground">
          <li>
            <p>
              Landlord address: {truncate(leaseDispute.landlordAddress, 6, 6, 6)}
            </p>
          </li>
          <li>
            <p>
              Tenant address: {truncate(leaseDispute.tenantAddress, 6, 6, 6)}
            </p>
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <div>
          <p>
            Current number of voters: <b>{numVoters}/2</b>
          </p>
          <p>
            Tenant Dispute Status: <b>{leaseDispute.status}</b>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
