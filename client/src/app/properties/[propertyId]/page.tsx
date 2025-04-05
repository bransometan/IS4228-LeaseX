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
  const [pendingApplications, setPendingApplications] = useState<LeaseApplicationStruct[]>([]);
  const [tenants, setTenants] = useState<LeaseApplicationStruct[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const leasePropertyId = params.propertyId as string;

  useEffect(() => {
    const getLeasePropertyInfo = async () => {
      const leaseProperty = await getLeasePropertyById(Number(leasePropertyId));
      setLeaseProperty(leaseProperty);

      const applications = await getAllLeaseApplicationsByLeasePropertyId(Number(leasePropertyId));
      setPendingApplications(
        applications.filter((app) => app.status === LeaseStatus.PENDING)
      );
      setTenants(
        applications.filter((app) => app.status !== LeaseStatus.PENDING)
      );

      setLoading(false);
    };
    getLeasePropertyInfo();
  }, [leasePropertyId]);

  if (loading || !leaseProperty) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-gray-500">Loading lease property details...</p>
      </div>
    );
  }

  return (
    <main className="px-4 md:px-8 py-8 max-w-screen-2xl mx-auto space-y-10">
      <Link
        href="/properties"
        className="inline-flex items-center text-sm text-indigo-600 hover:underline"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Back to My Properties
      </Link>

      <section className="space-y-4">
        <h1 className="text-3xl font-bold text-indigo-700">Property Overview</h1>
        <MyPropertyCard leaseProperty={leaseProperty} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Current Tenants</h2>
        {tenants.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {tenants.map((application) => (
              <LeaseApplicationCard
                key={application.applicationId}
                leaseApplication={application}
                leaseProperty={leaseProperty}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">You currently have no tenants.</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Pending Applications</h2>
        {pendingApplications.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {pendingApplications.map((application) => (
              <LeaseApplicationCard
                key={application.applicationId}
                leaseApplication={application}
                leaseProperty={leaseProperty}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">You currently have no pending applications.</p>
        )}
      </section>
    </main>
  );
}
