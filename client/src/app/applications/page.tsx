"use client";

import { UserRole } from "@/constants";
import { checkUserRole } from "@/lib/utils";
import { getLeaseApplicationByTenant } from "@/services/leaseMarketplace";
import { LeaseApplicationStruct, LeasePropertyStruct } from "@/types/structs";
import { useSession } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";
import LeaseApplicationCard from "./components/LeaseApplicationCard";
import { getLeasePropertyById } from "@/services/leaseProperty";
import CurrentLeasePropertyCard from "./components/CurrentLeasePropertyCard";

export default function Applications() {
  const { session } = useSession();
  const role = checkUserRole(session);
  const [currentApplication, setCurrentApplication] =
    useState<LeaseApplicationStruct>();
  const [currentLeaseProperty, setCurrentLeaseProperty] =
    useState<LeasePropertyStruct>();

  useEffect(() => {
    const getCurrentApplicationWithLeaseProperty = async () => {
      const currentApplication = await getLeaseApplicationByTenant();
      setCurrentApplication(currentApplication);
      if (currentApplication) {
        const leaseProperty = await getLeasePropertyById(
          currentApplication.leasePropertyId
        );
        setCurrentLeaseProperty(leaseProperty);
      }
    };
    getCurrentApplicationWithLeaseProperty();
  }, []);

  // Page is only for tenants to access
  if (role !== UserRole.Tenant) return;

  return (
    <div className="space-y-4">
      <h1 className="font-bold">My Applications</h1>
      <div className="space-y-4">
        {currentApplication && currentLeaseProperty ? (
          <>
            <LeaseApplicationCard
              leaseApplication={currentApplication}
              leaseProperty={currentLeaseProperty}
            />
            <h1 className="font-bold">Lease Property Details</h1>
            <CurrentLeasePropertyCard
              leaseProperty={currentLeaseProperty!}
            />
          </>
        ) : (
          <p>You do not have any applications</p>
        )}
      </div>
    </div>
  );
}
