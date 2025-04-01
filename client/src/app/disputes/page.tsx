"use client";

import {
  getAllDisputes,
  getDisputesByLandlord,
  getDisputesByTenant,
} from "@/services/leaseDisputeDAO";
import { DisputeStatus, LeaseDisputeStruct } from "@/types/structs";
import React, { useEffect, useState } from "react";
import DisputeCard from "./components/DisputeCard";
import { useSession } from "@clerk/nextjs";
import { checkUserRole, cn } from "@/lib/utils";
import { UserRole } from "@/constants";

export default function Disputes() {
  const { session, isLoaded } = useSession();
  const role = checkUserRole(session);
  const [pendingDisputes, setPendingDisputes] = useState<LeaseDisputeStruct[]>();
  const [resolvedDisputes, setResolvedDisputes] =
    useState<LeaseDisputeStruct[]>();

  useEffect(() => {
    const getDisputes = async () => {
      const disputes =
        role === UserRole.Tenant
          ? await getDisputesByTenant()
          : role === UserRole.Landlord
          ? await getDisputesByLandlord()
          : role === UserRole.Validator
          ? await getAllDisputes()
          : [];
      setPendingDisputes(
        disputes.filter((dispute) => dispute.status === DisputeStatus.PENDING)
      );
      setResolvedDisputes(
        disputes.filter((dispute) => dispute.status !== DisputeStatus.PENDING)
      );
    };
    getDisputes();
  }, [isLoaded]);

  return (
    <div className="space-y-4">
      <h1 className="font-bold">Pending disputes</h1>
      <div
        className={cn(
          (role === UserRole.Validator || role === UserRole.Landlord) &&
            "grid grid-cols-3 gap-4"
        )}
      >
        {pendingDisputes && pendingDisputes.length > 0 ? (
          pendingDisputes.map((dispute, i) => (
            <DisputeCard key={i} leaseDispute={dispute} />
          ))
        ) : (
          <p>You have no pending disputes</p>
        )}
      </div>
      <h1 className="font-bold">Resolved disputes</h1>
      <div className="grid grid-cols-3 gap-4">
        {resolvedDisputes && resolvedDisputes.length > 0 ? (
          resolvedDisputes.map((dispute, i) => (
            <DisputeCard key={i} leaseDispute={dispute} />
          ))
        ) : (
          <p>You have no resolved disputes</p>
        )}
      </div>
    </div>
  );
}
