"use client";

import { getAllListedLeaseProperties } from "@/services/leaseProperty";
import { LeasePropertyStruct } from "@/types/structs";
import React, { useEffect, useState } from "react";
import LeasePropertyCard from "./components/LeasePropertyCard";

export default function Marketplace() {
  const [leaseProperties, setLeaseProperties] =
    useState<LeasePropertyStruct[]>();

  useEffect(() => {
    const getLeaseProperties = async () => {
      const leaseProperties = await getAllListedLeaseProperties();
      setLeaseProperties(leaseProperties);
    };
    getLeaseProperties();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="font-bold">Marketplace</h1>
      <div className="grid grid-cols-3 gap-4">
        {leaseProperties?.map((leaseProperty, i) => {
          return <LeasePropertyCard key={i} leaseProperty={leaseProperty} />;
        })}
      </div>
    </div>
  );
}
