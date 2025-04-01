"use client";

import { getBalance } from "@/services/xToken";
import { checkWallet } from "@/services/wallet";
import { store } from "@/store";
import React, { useEffect } from "react";
import { Provider } from "react-redux";

export default function ReduxProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    checkWallet();
    getBalance();
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
