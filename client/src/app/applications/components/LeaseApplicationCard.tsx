import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  LeaseStatus,
  LeaseApplicationStruct,
  LeasePropertyStruct,
} from "@/types/structs";
import { CircleEllipsis } from "lucide-react";
import CancelLeaseApplicationDialog from "./CancelLeaseApplicationDialog";
import { Separator } from "@/components/ui/separator";
import { checkUserRole, truncate } from "@/lib/utils";
import { useSession } from "@clerk/nextjs";
import AcceptLeaseApplicationDialog from "./AcceptLeaseApplicationDialog";
import { UserRole } from "@/constants";
import MakePaymentDialog from "./MakePaymentDialog";
import AcceptPaymentDialog from "./AcceptPaymentDialog";
import MoveOutDialog from "./MoveOutDialog";
import CreateDisputeForm from "./CreateDisputeForm";

const LeaseApplicationActionsDropdown = ({
  leaseApplication,
  leaseProperty,
}: {
  leaseApplication: LeaseApplicationStruct;
  leaseProperty: LeasePropertyStruct;
}) => {
  const { session } = useSession();
  const role = checkUserRole(session);

  return (
    <Popover>
      <PopoverTrigger className="absolute right-1 top-1">
        <CircleEllipsis color="gray" />
      </PopoverTrigger>
      <PopoverContent className="text-sm absolute right-0 top-0 w-[100px]">
        <div>
          <ul className="space-y-1">
            {role === UserRole.Landlord &&
              leaseApplication.status === LeaseStatus.PENDING && (
                <AcceptLeaseApplicationDialog
                  leasePropertyId={leaseApplication.leasePropertyId}
                  applicationId={leaseApplication.applicationId}
                />
              )}
            {((role === UserRole.Landlord &&
              leaseApplication.status === LeaseStatus.PENDING) ||
              (role === UserRole.Tenant &&
                leaseApplication.status === LeaseStatus.PENDING)) && (
              <CancelLeaseApplicationDialog
                leasePropertyId={leaseApplication.leasePropertyId}
                applicationId={leaseApplication.applicationId}
              />
            )}
            {role === UserRole.Tenant &&
              leaseApplication.status === LeaseStatus.ONGOING && (
                <MakePaymentDialog
                  leaseProperty={leaseProperty}
                  application={leaseApplication}
                />
              )}
            {role === UserRole.Landlord &&
              leaseApplication.status === LeaseStatus.MADE_PAYMENT && (
                <AcceptPaymentDialog
                  leaseProperty={leaseProperty}
                  application={leaseApplication}
                />
              )}
            {role === UserRole.Tenant &&
              leaseApplication.status === LeaseStatus.COMPLETED && (
                <>
                  <MoveOutDialog
                    leasePropertyId={leaseProperty.leasePropertyId}
                    applicationId={leaseApplication.applicationId}
                  />
                  <Separator />
                  <CreateDisputeForm
                    leasePropertyId={leaseProperty.leasePropertyId}
                    applicationId={leaseApplication.applicationId}
                  />
                </>
              )}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function LeaseApplicationCard({
  leaseApplication,
  leaseProperty,
}: {
  leaseApplication: LeaseApplicationStruct;
  leaseProperty: LeasePropertyStruct;
}) {
  return (
    <Card>
      <CardHeader className="font-bold relative">
        <LeaseApplicationActionsDropdown
          leaseApplication={leaseApplication}
          leaseProperty={leaseProperty}
        />
        <CardTitle>Application Id: {leaseApplication.applicationId}</CardTitle>
        <CardTitle>
          Lease Property Id: {leaseApplication.leasePropertyId}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p> {leaseApplication.description}</p>
        <hr />
        <ul className="text-sm text-muted-foreground">
          <li>
            <p>
              Landlord address:{" "}
              {truncate(leaseApplication.landlordAddress, 6, 6, 6)}
            </p>
          </li>
          <li>
            <p>Months paid: {leaseApplication.monthsPaid}</p>
          </li>
          <li>
            {leaseApplication.paymentIds.length > 0 ? (
              <p>
                Payments Made (ID) (Includes deposit): [
                {leaseApplication.paymentIds.join(", ")}]
              </p>
            ) : (
              <p>No payments made yet</p>
            )}
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <p>
          Payment Status: <b>{leaseApplication.status}</b>
        </p>
      </CardFooter>
    </Card>
  );
}
