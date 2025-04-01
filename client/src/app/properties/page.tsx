"use client";

import React, { useEffect, useState } from "react";
import AddLeasePropertyForm from "./components/AddLeasePropertyForm";
import {
  getListedLeasePropertiesByLandlord,
  getUnlistedLeasePropertiesByLandlord,
} from "@/services/leaseProperty";
import { LeasePropertyStruct } from "@/types/structs";
import MyPropertyCard from "./components/MyPropertyCard";

export default function MyProperties() {
  const [listedLeaseProperties, setListedLeaseProperties] =
    useState<LeasePropertyStruct[]>();
  const [unlistedLeaseProperties, setUnlistedLeaseProperties] =
    useState<LeasePropertyStruct[]>();

  useEffect(() => {
    const getLeaseProperties = async () => {
      const listedLeaseProperties =
        await getListedLeasePropertiesByLandlord();
      setListedLeaseProperties(listedLeaseProperties);
      const unlistedLeaseProperties =
        await getUnlistedLeasePropertiesByLandlord();
      setUnlistedLeaseProperties(unlistedLeaseProperties);
    };
    getLeaseProperties();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="font-bold">My Properties</h1>
        <AddLeasePropertyForm />
      </div>
      <div className="space-y-4">
        <h1 className="font-bold">Listed Properties</h1>
        <div className="grid grid-cols-3 gap-4">
          {listedLeaseProperties?.map((leaseProperty, i) => {
            return <MyPropertyCard key={i} leaseProperty={leaseProperty} />;
          })}
        </div>
      </div>
      <div className="space-y-4">
        <h1 className="font-bold">Unlisted Properties</h1>
        <div className="grid grid-cols-3 gap-4">
          {unlistedLeaseProperties?.map((leaseProperty, i) => {
            return <MyPropertyCard key={i} leaseProperty={leaseProperty} />;
          })}
        </div>
      </div>
    </div>
  );
}
