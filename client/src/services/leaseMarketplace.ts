import { LeaseStatus, LeaseApplicationStruct } from "@/types/structs";
import { DeployedContract, getContract } from "./contractFactory";
import { getBalance } from "./xToken";

let ethereum: any;

if (typeof window !== "undefined") {
  ethereum = (window as any).ethereum;
}

export const listLeaseProperty = async (
  leasePropertyId: number,
  depositFee: number
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const leaseMarketplaceContract = await getContract(
      DeployedContract.LeaseMarketplaceContract
    );
    const tx = await leaseMarketplaceContract.listALeaseProperty(
      leasePropertyId,
      depositFee
    );
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const unlistLeaseProperty = async (leasePropertyId: number) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const leaseMarketplaceContract = await getContract(
      DeployedContract.LeaseMarketplaceContract
    );
    const tx = await leaseMarketplaceContract.unlistALeaseProperty(
      leasePropertyId
    );
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const applyLeaseProperty = async (
  leasePropertyId: number,
  tenantName: string,
  tenantEmail: string,
  tenantPhone: string,
  description: string
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const leaseMarketplaceContract = await getContract(
      DeployedContract.LeaseMarketplaceContract
    );
    const tx = await leaseMarketplaceContract.applyLeaseProperty(
      leasePropertyId,
      tenantName,
      tenantEmail,
      tenantPhone,
      description
    );
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const getLeaseApplicationByTenant = async () => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }
  const accounts = await ethereum.request?.({ method: "eth_accounts" });

  try {
    const leaseMarketplaceContract = await getContract(
      DeployedContract.LeaseMarketplaceContract
    );
    let leaseApplication: LeaseApplicationStruct =
      await leaseMarketplaceContract.getLeaseApplicationByTenant(
        accounts?.[0]
      );
    leaseApplication = _structureLeaseApplication(leaseApplication);
    // As Solidity cannot return nothing, returned an empty leaseApplication to signify
    if (leaseApplication.paymentIds.length != 0) {
      return leaseApplication;
    }
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

/**
 * Usable by BOTH tenant or landlord
 * @param leasePropertyId
 * @param applicationId
 * @returns
 */
export const cancelOrRejectLeaseApplication = async (
  leasePropertyId: number,
  applicationId: number
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const leaseMarketplaceContract = await getContract(
      DeployedContract.LeaseMarketplaceContract
    );
    const tx = await leaseMarketplaceContract.cancelOrRejectLeaseApplication(
      leasePropertyId,
      applicationId
    );
    await tx.wait();
    await getBalance(); // Since the tenant will be refunded the deposit (XToken)
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const getAllLeaseApplicationsByLeasePropertyId = async (
  leasePropertyId: number
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const leaseMarketplaceContract = await getContract(
      DeployedContract.LeaseMarketplaceContract
    );
    const leaseApplications: LeaseApplicationStruct[] =
      await leaseMarketplaceContract.getAllLeaseApplicationsFromLeaseProperty(
        leasePropertyId
      );
    return leaseApplications.map((application) =>
      _structureLeaseApplication(application)
    );
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const acceptLeaseApplication = async (
  leasePropertyId: number,
  applicationId: number
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const leaseMarketplaceContract = await getContract(
      DeployedContract.LeaseMarketplaceContract
    );
    const tx = await leaseMarketplaceContract.acceptLeaseApplication(
      leasePropertyId,
      applicationId
    );
    await tx.wait();
    await getBalance(); // Since the deposit by tenant is released to landlord
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const makePayment = async (
  leasePropertyId: number,
  applicationId: number
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const leaseMarketplaceContract = await getContract(
      DeployedContract.LeaseMarketplaceContract
    );
    const tx = await leaseMarketplaceContract.makePayment(
      leasePropertyId,
      applicationId
    );
    await tx.wait();
    await getBalance(); // Since payment in XTokens is made
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const acceptPayment = async (
  leasePropertyId: number,
  applicationId: number
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const leaseMarketplaceContract = await getContract(
      DeployedContract.LeaseMarketplaceContract
    );
    const tx = await leaseMarketplaceContract.acceptPayment(
      leasePropertyId,
      applicationId
    );
    await tx.wait();
    await getBalance(); // Since payment in XTokens is accepted
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const moveOut = async (
  leasePropertyId: number,
  applicationId: number
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const leaseMarketplaceContract = await getContract(
      DeployedContract.LeaseMarketplaceContract
    );
    const tx = await leaseMarketplaceContract.moveOut(
      leasePropertyId,
      applicationId
    );
    await tx.wait();
    await getBalance(); // Since deposit fee is returned to tenant
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const getDepositAmountForLeasePropertyId = async (
  leasePropertyId: number
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const leaseMarketplaceContract = await getContract(
      DeployedContract.LeaseMarketplaceContract
    );
    const depositAmount: BigInt =
      await leaseMarketplaceContract.getDepositAmount(leasePropertyId);
    return Promise.resolve(Number(depositAmount));
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

const _structureLeaseApplication = (
  leaseApplication: any
): LeaseApplicationStruct => {
  // Solidity end returns BigNumber, so need convert to Number
  // Soldity enum returns BigNumber, so need convert
  return {
    leasePropertyId: Number(leaseApplication.leasePropertyId),
    applicationId: Number(leaseApplication.applicationId),
    landlordAddress: leaseApplication.landlordAddress,
    tenantAddress: leaseApplication.tenantAddress,
    tenantName: leaseApplication.tenantName,
    tenantEmail: leaseApplication.tenantEmail,
    tenantPhone: leaseApplication.tenantPhone,
    description: leaseApplication.description,
    monthsPaid: Number(leaseApplication.monthsPaid),
    status: Object.values(LeaseStatus)[Number(leaseApplication.status)],
    paymentIds: leaseApplication.paymentIds.map((id: BigInt) => Number(id)),
  };
};
