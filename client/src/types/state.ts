export interface GlobalState {
  wallet: string;
  xTokens: number;
}

export interface RootState {
  globalStates: GlobalState;
}
