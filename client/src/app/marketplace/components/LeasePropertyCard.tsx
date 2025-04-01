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
import { UserRole } from "@/constants";
import { checkUserRole } from "@/lib/utils";
import { LeasePropertyStruct } from "@/types/structs";
import { useSession } from "@clerk/nextjs";
import { CircleEllipsis } from "lucide-react";
import React from "react";
import ApplyLeasePropertyForm from "./ApplyLeasePropertyForm";

const LeasePropertyActionsDropdown = ({
  leaseProperty,
}: {
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
            {role === UserRole.Tenant && (
              <ApplyLeasePropertyForm
                leasePropertyId={leaseProperty.leasePropertyId}
              />
            )}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function LeasePropertyCard({
  leaseProperty,
}: {
  leaseProperty: LeasePropertyStruct;
}) {
  return (
    <Card>
      <CardHeader className="font-bold relative">
        <LeasePropertyActionsDropdown leaseProperty={leaseProperty} />
        <CardTitle>{leaseProperty.location}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p> {leaseProperty.description}</p>
        <hr />
        <ul className="text-sm text-muted-foreground">
          <li>
            <p>Lease duration (months): {leaseProperty.leaseDuration}</p>
          </li>
          <li>
            <p>Number of tenants: {leaseProperty.numOfTenants}</p>
          </li>
          <li>
            <p>Postal code: {leaseProperty.postalCode}</p>
          </li>
          <li>
            <p>Property type: {leaseProperty.propertyType}</p>
          </li>
        </ul>
      </CardContent>
      <CardFooter>
        <p>
          <b>{leaseProperty.leasePrice}</b> XToken/month
        </p>
      </CardFooter>
    </Card>
  );
}
