"use client";

import { getAllListedLeaseProperties } from "@/services/leaseProperty";
import { LeasePropertyStruct } from "@/types/structs";
import React, { useEffect, useState } from "react";
import LeasePropertyCard from "./components/LeasePropertyCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Marketplace() {
  const [leaseProperties, setLeaseProperties] =
    useState<LeasePropertyStruct[]>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getLeaseProperties = async () => {
      const leaseProperties = await getAllListedLeaseProperties();
      setLeaseProperties(leaseProperties);
      setLoading(false);
    };
    getLeaseProperties();
  }, []);

  return (
    <main className="px-4 md:px-8 py-8 max-w-screen-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-indigo-700">Marketplace</h1>
        <p className="text-gray-600 mt-2">
          Browse available lease properties and discover your next space.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-60 rounded-xl" />
          ))}
        </div>
      ) : leaseProperties && leaseProperties.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {leaseProperties.map((leaseProperty, i) => (
            <LeasePropertyCard key={i} leaseProperty={leaseProperty} />
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 mt-10">
          No lease properties available at the moment.
        </div>
      )}
    </main>
  );
}
