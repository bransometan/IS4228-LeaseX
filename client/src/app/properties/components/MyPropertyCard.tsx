"use client";

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
import { Separator } from "@/components/ui/separator";
import { LeaseApplicationStruct, LeasePropertyStruct } from "@/types/structs";
import { CircleEllipsis } from "lucide-react";
import React, { useEffect, useState } from "react";
import EditLeasePropertyForm from "./EditLeasePropertyForm";
import DeleteLeasePropertyDialog from "./DeleteLeaseProperyDialog";
import ListLeasePropertyDialog from "./ListLeaseProperyDialog";
import Link from "next/link";
import { useParams } from "next/navigation";
import UnlistLeasePropertyDialog from "./UnlistLeasePropertyDialog";
import { getAllLeaseApplicationsByLeasePropertyId } from "@/services/leaseMarketplace";

const MyPropertyActionsDropdown = ({
  leaseProperty,
}: {
  leaseProperty: LeasePropertyStruct;
}) => {
  return (
    <Popover>
      <PopoverTrigger className="absolute right-1 top-1">
        <CircleEllipsis color="gray" />
      </PopoverTrigger>
      <PopoverContent className="text-sm absolute right-0 top-0 w-[100px]">
        <div>
          <ul className="space-y-1">
            {!leaseProperty.isListed ? (
              <>
                <ListLeasePropertyDialog
                  leasePropertyId={leaseProperty.leasePropertyId}
                />
                <Separator />
                <EditLeasePropertyForm leaseProperty={leaseProperty} />
                <Separator />
                <DeleteLeasePropertyDialog
                  leasePropertyId={leaseProperty.leasePropertyId}
                />
              </>
            ) : (
              <UnlistLeasePropertyDialog
                leasePropertyId={leaseProperty.leasePropertyId}
              />
            )}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default function MyPropertyCard({
  leaseProperty,
}: {
  leaseProperty: LeasePropertyStruct;
}) {
  const params = useParams();
  const propertyId = params.propertyId;
  return (
    <Card>
      <CardHeader className="font-bold relative">
        <MyPropertyActionsDropdown leaseProperty={leaseProperty} />
        <CardTitle>{leaseProperty.location}</CardTitle>
      </CardHeader>
      {!propertyId ? (
        <Link href={`/properties/${leaseProperty.leasePropertyId}`}>
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
        </Link>
      ) : (
        <>
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
        </>
      )}
    </Card>
  );
}
