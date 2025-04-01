import { store } from "@/store";
import { DeployedContract, getContract } from "./contractFactory";
import { globalActions } from "@/store/globalSlices";
import { ethers } from "ethers";

let ethereum: any;

if (typeof window !== "undefined") {
  ethereum = (window as any).ethereum;
}

const { setXTokens } = globalActions;

export const getXToken = async (valueInEth: number) => {
  try {
    if (!ethereum) {
      reportError("Please install Metamask");
      return Promise.reject(new Error("Metamask not installed'"));
    }

    const xTokenContract = await getContract(
      DeployedContract.XTokenContract
    );
    const options = { value: ethers.parseEther(valueInEth.toString()) };
    const tx = await xTokenContract.getXToken(options);
    await tx.wait();
    await getBalance();
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const getBalance = async () => {
  try {
    if (!ethereum) {
      store.dispatch(setXTokens(0));
      reportError("Please install Metamask");
      return Promise.reject(new Error("Metamask not installed'"));
    }
    const accounts = await ethereum.request?.({
      method: "eth_requestAccounts",
    });

    const xTokenContract = await getContract(
      DeployedContract.XTokenContract
    );
    const balance = await xTokenContract.checkXToken(accounts?.[0]);
    store.dispatch(setXTokens(Number(balance)));
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};

export const convertXTokenToETH = async (xTokenAmount: number) => {
  try {
    if (!ethereum) {
      reportError("Please install Metamask");
      return Promise.reject(new Error("Metamask not installed'"));
    }
    const accounts = await ethereum.request?.({
      method: "eth_requestAccounts",
    });

    const xTokenContract = await getContract(
      DeployedContract.XTokenContract
    );
    const tx = await xTokenContract.convertXTokenToETH(
      accounts?.[0],
      xTokenAmount
    );
    await tx.wait();
    await getBalance();
  } catch (error) {
    reportError(error);
    return Promise.reject(error);
  }
};
