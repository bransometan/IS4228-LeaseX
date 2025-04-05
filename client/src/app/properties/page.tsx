"use client";

import React, { useEffect, useState } from "react";
import AddLeasePropertyForm from "./components/AddLeasePropertyForm";
import {
  getListedLeasePropertiesByLandlord,
  getUnlistedLeasePropertiesByLandlord,
} from "@/services/leaseProperty";
import { LeasePropertyStruct } from "@/types/structs";
import MyPropertyCard from "./components/MyPropertyCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function MyProperties() {
  const [listedLeaseProperties, setListedLeaseProperties] =
    useState<LeasePropertyStruct[]>();
  const [unlistedLeaseProperties, setUnlistedLeaseProperties] =
    useState<LeasePropertyStruct[]>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getLeaseProperties = async () => {
      const listedLeaseProperties =
        await getListedLeasePropertiesByLandlord();
      setListedLeaseProperties(listedLeaseProperties);

      const unlistedLeaseProperties =
        await getUnlistedLeasePropertiesByLandlord();
      setUnlistedLeaseProperties(unlistedLeaseProperties);

      setLoading(false);
    };
    getLeaseProperties();
  }, []);

  return (
    <main className="px-4 md:px-8 py-8 max-w-screen-2xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-3xl font-bold text-indigo-700">My Properties</h1>
        <AddLeasePropertyForm />
      </div>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Listed Properties</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-60 rounded-xl" />
            ))}
          </div>
        ) : listedLeaseProperties && listedLeaseProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {listedLeaseProperties.map((leaseProperty, i) => (
              <MyPropertyCard key={i} leaseProperty={leaseProperty} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">You have no listed properties.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Unlisted Properties</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-60 rounded-xl" />
            ))}
          </div>
        ) : unlistedLeaseProperties && unlistedLeaseProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {unlistedLeaseProperties.map((leaseProperty, i) => (
              <MyPropertyCard key={i} leaseProperty={leaseProperty} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">You have no unlisted properties.</p>
        )}
      </section>
    </main>
  );
}
