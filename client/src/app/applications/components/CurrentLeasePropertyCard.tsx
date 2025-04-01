import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LeasePropertyStruct } from "@/types/structs";
import React from "react";

export default function CurrentLeasePropertyCard({
  leaseProperty,
}: {
  leaseProperty: LeasePropertyStruct;
}) {
  return (
    <Card>
      <CardHeader className="font-bold relative">
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
