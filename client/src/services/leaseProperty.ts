import { enumValueToIndex } from "@/lib/utils";
import { DeployedContract, getContract } from "./contractFactory";
import { PropertyType, LeasePropertyStruct } from "@/types/structs";
import { getBalance } from "./xToken";

export interface AddLeasePropertyParams {
  location: string;
  postalCode: string;
  unitNumber: string;
  propertyType: PropertyType;
  description: string;
  numOfTenants: number;
  leasePrice: number;
  leaseDuration: number;
}

export interface UpdateLeasePropertyParams {
  location: string;
  postalCode: string;
  unitNumber: string;
  propertyType: PropertyType;
  description: string;
  numOfTenants: number;
  leasePrice: number;
  leaseDuration: number;
}

let ethereum: any;

if (typeof window !== "undefined") {
  ethereum = (window as any).ethereum;
}

export const addLeaseProperty = async (data: AddLeasePropertyParams) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed'"));
  }

  try {
    const leasePropertyContract = await getContract(
      DeployedContract.LeasePropertyContract
    );
    const {
      location,
      postalCode,
      unitNumber,
      propertyType,
      description,
      numOfTenants,
      leasePrice,
      leaseDuration,
    } = data;
    const tx = await leasePropertyContract.addLeaseProperty(
      location,
      postalCode,
      unitNumber,
      enumValueToIndex(PropertyType, propertyType), // Index required on solidity end
      description,
      numOfTenants,
      leasePrice,
      leaseDuration
    );
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

/**
 * Returns all listed lease property by landlord
 * @returns lease properties
 */
export const getListedLeasePropertiesByLandlord = async (): Promise<
  LeasePropertyStruct[]
> => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }
  const accounts = await ethereum.request?.({ method: "eth_accounts" });

  const leasePropertyContract = await getContract(
    DeployedContract.LeasePropertyContract
  );
  const leaseProperties: LeasePropertyStruct[] =
    await leasePropertyContract.getLandlordListedLeaseProperties(accounts[0]);
  return leaseProperties.map((leaseProperty) =>
    _structureLeaseProperty(leaseProperty)
  );
};

/**
 * Returns all unlisted lease property by landlord
 * @returns lease properties
 */
export const getUnlistedLeasePropertiesByLandlord = async (): Promise<
  LeasePropertyStruct[]
> => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }
  const accounts = await ethereum.request?.({ method: "eth_accounts" });

  const leasePropertyContract = await getContract(
    DeployedContract.LeasePropertyContract
  );
  const leaseProperties: LeasePropertyStruct[] =
    await leasePropertyContract.getLandlordUnlistedLeaseProperties(
      accounts[0]
    );
  return leaseProperties.map((leaseProperty) =>
    _structureLeaseProperty(leaseProperty)
  );
};

/**
 * Returns a lease property
 * @param id leasePropertyId
 * @returns lease property
 */
export const getLeasePropertyById = async (
  id: number
): Promise<LeasePropertyStruct> => {
  const leasePropertyContract = await getContract(
    DeployedContract.LeasePropertyContract
  );
  const leaseProperty: LeasePropertyStruct =
    await leasePropertyContract.getLeaseProperty(id);
  return _structureLeaseProperty(leaseProperty);
};

export const updateLeasePropertyById = async (
  id: number,
  props: UpdateLeasePropertyParams
) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }
  try {
    const leasePropertyContract = await getContract(
      DeployedContract.LeasePropertyContract
    );

    const {
      location,
      postalCode,
      unitNumber,
      propertyType,
      description,
      numOfTenants,
      leasePrice,
      leaseDuration,
    } = props;

    const tx = await leasePropertyContract.updateLeaseProperty(
      id,
      location,
      postalCode,
      unitNumber,
      enumValueToIndex(PropertyType, propertyType),
      description,
      numOfTenants,
      leasePrice,
      leaseDuration
    );
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const deleteLeasePropertyById = async (id: number) => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const leasePropertyContract = await getContract(
      DeployedContract.LeasePropertyContract
    );
    const tx = await leasePropertyContract.deleteLeaseProperty(id);
    await tx.wait();
    return Promise.resolve(tx);
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const getAllListedLeaseProperties = async () => {
  if (!ethereum) {
    reportError("Please install Metamask");
    return Promise.reject(new Error("Metamask not installed"));
  }

  try {
    const leasePropertyContract = await getContract(
      DeployedContract.LeasePropertyContract
    );
    const listedLeaseProperties: any[] =
      await leasePropertyContract.getAllListedLeaseProperties();
    await getBalance(); // update the balance after deduction of protection fee for listing
    return listedLeaseProperties.map((leaseProperty) =>
      _structureLeaseProperty(leaseProperty)
    );
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

/**
 * Process lease property for display on frontend
 * @param leaseProperty
 * @returns processed LeaseProperty
 */
const _structureLeaseProperty = (leaseProperty: any) => {
  // Solidity end returns BigNumber, so need convert to Number
  return {
    leasePropertyId: Number(leaseProperty.leasePropertyId),
    location: leaseProperty.location,
    postalCode: leaseProperty.postalCode,
    unitNumber: leaseProperty.unitNumber,
    propertyType:
      Object.values(PropertyType)[Number(leaseProperty.propertyType)],
    description: leaseProperty.description,
    numOfTenants: Number(leaseProperty.numOfTenants),
    leasePrice: Number(leaseProperty.leasePrice),
    leaseDuration: Number(leaseProperty.leaseDuration),
    landlord: leaseProperty.landlord,
    updateStatus: leaseProperty.updateStatus,
    isListed: leaseProperty.isListed,
    paymentId: Number(leaseProperty.paymentId),
  };
};
