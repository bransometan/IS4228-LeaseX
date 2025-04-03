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
import { checkUserRole } from "@/lib/utils";
import { UserRole } from "@/constants";

export default function Disputes() {
  const { session, isLoaded } = useSession();
  const role = checkUserRole(session);
  const [pendingDisputes, setPendingDisputes] = useState<LeaseDisputeStruct[]>([]);
  const [resolvedDisputes, setResolvedDisputes] = useState<LeaseDisputeStruct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getDisputes = async () => {
      if (!isLoaded || !role) return;

      let disputes: LeaseDisputeStruct[] = [];

      if (role === UserRole.Tenant) {
        disputes = await getDisputesByTenant();
      } else if (role === UserRole.Landlord) {
        disputes = await getDisputesByLandlord();
      } else if (role === UserRole.Validator) {
        disputes = await getAllDisputes();
      }

      setPendingDisputes(disputes.filter(d => d.status === DisputeStatus.PENDING));
      setResolvedDisputes(disputes.filter(d => d.status !== DisputeStatus.PENDING));
      setLoading(false);
    };

    getDisputes();
  }, [isLoaded, role]);

  return (
    <main className="px-4 md:px-8 py-8 max-w-screen-2xl mx-auto space-y-10">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-indigo-700">Disputes</h1>
        <p className="text-gray-600">
          View your ongoing and resolved lease disputes. Validators can review and resolve disputes across the platform.
        </p>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Disputes</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : pendingDisputes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {pendingDisputes.map((dispute, i) => (
              <DisputeCard key={i} leaseDispute={dispute} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">You have no pending disputes.</p>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Resolved Disputes</h2>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : resolvedDisputes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {resolvedDisputes.map((dispute, i) => (
              <DisputeCard key={i} leaseDispute={dispute} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">You have no resolved disputes.</p>
        )}
      </section>
    </main>
  );
}
