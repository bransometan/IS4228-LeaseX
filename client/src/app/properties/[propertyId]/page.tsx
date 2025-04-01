"use client";

import { getLeasePropertyById } from "@/services/leaseProperty";
import {
  LeaseStatus,
  LeaseApplicationStruct,
  LeasePropertyStruct,
} from "@/types/structs";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import MyPropertyCard from "../components/MyPropertyCard";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { getAllLeaseApplicationsByLeasePropertyId } from "@/services/leaseMarketplace";
import LeaseApplicationCard from "@/app/applications/components/LeaseApplicationCard";

export default function LeasePropertyOverview() {
  const [leaseProperty, setLeaseProperty] = useState<LeasePropertyStruct>();
  const [pendingApplications, setPendingApplications] =
    useState<LeaseApplicationStruct[]>();
  const [tenants, setTenants] = useState<LeaseApplicationStruct[]>();
  const params = useParams();
  const leasePropertyId = params.propertyId as string;

  useEffect(() => {
    const getLeasePropertyInfo = async () => {
      // Lease Property details
      const leaseProperty = await getLeasePropertyById(
        Number(leasePropertyId)
      );
      setLeaseProperty(leaseProperty);

      // Applications
      const applications = await getAllLeaseApplicationsByLeasePropertyId(
        Number(leasePropertyId)
      );
      setPendingApplications(
        applications.filter((app) => app.status === LeaseStatus.PENDING)
      );
      setTenants(
        applications.filter((app) => app.status !== LeaseStatus.PENDING)
      );
    };
    getLeasePropertyInfo();
  }, []);

  if (!leaseProperty) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Link href={"/properties"}>
        <ArrowLeftIcon />
      </Link>
      <h1 className="font-bold">Overview</h1>
      <MyPropertyCard leaseProperty={leaseProperty} />
      <h1 className="font-bold">My Tenants</h1>
      {tenants && tenants.length ? (
        <div className="grid grid-cols-3 gap-4">
          {tenants.map((application) => (
            <LeaseApplicationCard
              leaseApplication={application}
              leaseProperty={leaseProperty}
            />
          ))}
        </div>
      ) : (
        <p>You currently have no tenants</p>
      )}
      <h1 className="font-bold">Pending Applications</h1>
      {pendingApplications && pendingApplications.length ? (
        <div className="grid grid-cols-3 gap-4">
          {pendingApplications.map((application) => (
            <LeaseApplicationCard
              leaseApplication={application}
              leaseProperty={leaseProperty}
            />
          ))}
        </div>
      ) : (
        <p>You currently have no pending applications</p>
      )}
    </div>
  );
}
