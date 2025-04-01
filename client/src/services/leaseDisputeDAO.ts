import {
  DisputeStatus,
  DisputeType,
  LeaseDisputeStruct,
  Vote,
} from "@/types/structs";
import { DeployedContract, getContract } from "./contractFactory";
import { getBalance } from "./xToken";
import { enumValueToIndex } from "@/lib/utils";

let ethereum: any;

if (typeof window !== "undefined") {
  ethereum = (window as any).ethereum;
}

export const createLeaseDispute = async (
  leasePropertyId: number,
  applicationId: number,
  disputeType: DisputeType,
  disputeReason: string
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }
  try {
    const leaseDisputeDAOContract = await getContract(
      DeployedContract.LeaseDisputeDAOContract
    );
    const tx = await leaseDisputeDAOContract.createLeaseDispute(
      leasePropertyId,
      applicationId,
      enumValueToIndex(DisputeType, disputeType), // Index required on solidity end
      disputeReason
    );
    await tx.wait();
    await getBalance(); // due to stake of voter rewards to payment escrow
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

/**
 * To be used by tenant to retrieve dispute made
 * @returns Lease Dispute
 */
export const getDisputesByTenant = async () => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }
  const accounts = await ethereum.request?.({ method: "eth_accounts" });

  try {
    const leaseDisputeDAOContract = await getContract(
      DeployedContract.LeaseDisputeDAOContract
    );
    const leaseDisputes: LeaseDisputeStruct[] =
      await leaseDisputeDAOContract.getDisputesByTenant(accounts?.[0]);
    return leaseDisputes.map((dispute) => _structureLeaseDispute(dispute));
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

/**
 * To be used by landlord to retrieve dispute made by tenant
 * @returns Lease Dispute
 */
export const getDisputesByLandlord = async () => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }
  const accounts = await ethereum.request?.({ method: "eth_accounts" });

  try {
    const leaseDisputeDAOContract = await getContract(
      DeployedContract.LeaseDisputeDAOContract
    );
    const leaseDisputes: LeaseDisputeStruct[] =
      await leaseDisputeDAOContract.getDisputesByLandlord(accounts?.[0]);
    return leaseDisputes.map((dispute) => _structureLeaseDispute(dispute));
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

/**
 * For use by validators to get all disputes
 * @returns Lease Disputes
 */
export const getAllDisputes = async () => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const leaseDisputeDAOContract = await getContract(
      DeployedContract.LeaseDisputeDAOContract
    );
    const leaseDisputes: LeaseDisputeStruct[] =
      await leaseDisputeDAOContract.getAllDisputes();
    return leaseDisputes.map((dispute) => _structureLeaseDispute(dispute));
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const voteOnLeaseDispute = async (disputeId: number, vote: Vote) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }
  try {
    const leaseDisputeDAOContract = await getContract(
      DeployedContract.LeaseDisputeDAOContract
    );
    const tx = await leaseDisputeDAOContract.voteOnLeaseDispute(
      disputeId,
      enumValueToIndex(Vote, vote) // Index required on solidity end
    );
    await tx.wait();
    await getBalance(); // due to stake of voter price to payment escrow
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const getNumVotersInDispute = async (disputeId: number) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const leaseDisputeDAOContract = await getContract(
      DeployedContract.LeaseDisputeDAOContract
    );
    const numVoters = await leaseDisputeDAOContract.getNumVotersInDispute(
      disputeId
    );
    return Number(numVoters);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

const _structureLeaseDispute = (
  leaseDispute: LeaseDisputeStruct
): LeaseDisputeStruct => {
  // Solidity end returns BigNumber, so need convert to Number
  // Soldity enum returns BigNumber, so need convert
  // Solidity timestamp is in s, Date is in ms
  return {
    leaseDisputeId: Number(leaseDispute.leaseDisputeId),
    leasePropertyId: Number(leaseDispute.leasePropertyId),
    applicationId: Number(leaseDispute.applicationId),
    tenantAddress: leaseDispute.tenantAddress,
    landlordAddress: leaseDispute.landlordAddress,
    startTime: new Date(Number(leaseDispute.startTime) * 1000),
    endTime: new Date(Number(leaseDispute.endTime) * 1000),
    status: Object.values(DisputeStatus)[Number(leaseDispute.status)],
    disputeType: Object.values(DisputeType)[Number(leaseDispute.disputeType)],
    disputeReason: leaseDispute.disputeReason,
  };
};
