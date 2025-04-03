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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentApplicationWithLeaseProperty = async () => {
      const application = await getLeaseApplicationByTenant();
      setCurrentApplication(application);
      if (application) {
        const leaseProperty = await getLeasePropertyById(
          application.leasePropertyId
        );
        setCurrentLeaseProperty(leaseProperty);
      }
      setLoading(false);
    };
    getCurrentApplicationWithLeaseProperty();
  }, []);

  // Page access restriction
  if (role !== UserRole.Tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        <p>Only tenants can view this page.</p>
      </div>
    );
  }

  return (
    <main className="px-4 md:px-8 py-8 max-w-screen-xl mx-auto space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-indigo-700">My Applications</h1>
        <p className="text-gray-600">
          View your current lease application and property details.
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : currentApplication && currentLeaseProperty ? (
        <div className="space-y-6">
          <LeaseApplicationCard
            leaseApplication={currentApplication}
            leaseProperty={currentLeaseProperty}
          />
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-800">Lease Property Details</h2>
            <CurrentLeasePropertyCard leaseProperty={currentLeaseProperty} />
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 pt-10">
          <p>You do not have any active applications.</p>
        </div>
      )}
    </main>
  );
}
