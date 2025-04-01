import { GlobalState } from "@/types/state";
import { PayloadAction } from "@reduxjs/toolkit";

export const globalActions = {
  setWallet: (state: GlobalState, action: PayloadAction<string>) => {
    state.wallet = action.payload;
  },
  setXTokens: (state: GlobalState, action: PayloadAction<number>) => {
    state.xTokens = action.payload;
  },
};
