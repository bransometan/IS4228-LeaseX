import { Addressable, Interface, InterfaceAbi, ethers } from "ethers";
import { GANACHE_NETWORK_ID } from "@/constants";
import LeasePropertyContract from "../../../build/contracts/LeaseProperty.json";
import LeaseMarketplaceContract from "../../../build/contracts/LeaseMarketplace.json";
import LeaseDisputeDAOContract from "../../../build/contracts/LeaseDisputeDAO.json";
import XTokenContract from "../../../build/contracts/XToken.json";
import PaymentEscrowContract from "../../../build/contracts/PaymentEscrow.json";

export enum DeployedContract {
  LeasePropertyContract,
  LeaseMarketplaceContract,
  LeaseDisputeDAOContract,
  XTokenContract,
  PaymentEscrowContract,
}

let ethereum: any;

if (typeof window !== "undefined") {
  ethereum = (window as any).ethereum;
}

/**
 * Return instance of Contract for client to interact
 * @returns An instance of Contract
 */
export const getContract = async (contract: DeployedContract) => {
  const provider = new ethers.BrowserProvider(ethereum);

  let deployedNetwork;
  let contractAddress: string | Addressable = "";
  let contractAbi: Interface | InterfaceAbi = "";

  switch (contract) {
    case DeployedContract.LeasePropertyContract:
      deployedNetwork = LeasePropertyContract.networks[GANACHE_NETWORK_ID];
      contractAddress = deployedNetwork.address;
      contractAbi = LeasePropertyContract.abi;
      break;
    case DeployedContract.LeaseMarketplaceContract:
      deployedNetwork = LeaseMarketplaceContract.networks[GANACHE_NETWORK_ID];
      contractAddress = deployedNetwork.address;
      contractAbi = LeaseMarketplaceContract.abi;
      break;
    case DeployedContract.LeaseDisputeDAOContract:
      deployedNetwork = LeaseDisputeDAOContract.networks[GANACHE_NETWORK_ID];
      contractAddress = deployedNetwork.address;
      contractAbi = LeaseDisputeDAOContract.abi;
      break;
    case DeployedContract.XTokenContract:
      deployedNetwork = XTokenContract.networks[GANACHE_NETWORK_ID];
      contractAddress = deployedNetwork.address;
      contractAbi = XTokenContract.abi;
      break;
    case DeployedContract.PaymentEscrowContract:
      deployedNetwork = PaymentEscrowContract.networks[GANACHE_NETWORK_ID];
      contractAddress = deployedNetwork.address;
      contractAbi = PaymentEscrowContract.abi;
      break;
    default:
      break;
  }

  const signer = await provider.getSigner();
  const contractInstance = new ethers.Contract(
    contractAddress,
    contractAbi,
    signer
  );
  return contractInstance;
};
