"use client";

import {
  capitalizeFirstLetter,
  checkUserRole,
  cn,
  truncate,
} from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { connectWallet } from "@/services/wallet";
import { RootState } from "@/types/state";
import { useSelector } from "react-redux";
import { SignedIn, UserButton, useSession } from "@clerk/nextjs";
import { UserRole } from "@/constants";

const TABS = [
  {
    href: "/marketplace",
    name: "Browse Properties",
    roles: [UserRole.Admin, UserRole.Landlord, UserRole.Tenant],
  },
  {
    href: "/applications",
    name: "My Applications",
    roles: [UserRole.Tenant],
  },
  {
    href: "/properties",
    name: "My Properties",
    roles: [UserRole.Admin, UserRole.Landlord],
  },
  {
    href: "/disputes",
    name: "Disputes",
    roles: [
      UserRole.Admin,
      UserRole.Landlord,
      UserRole.Tenant,
      UserRole.Validator,
    ],
  },
];

export default function Navbar() {
  const path = usePathname();
  const { wallet, xTokens } = useSelector(
    (states: RootState) => states.globalStates
  );
  const { session } = useSession();
  const role = checkUserRole(session);

  return (
    <nav className="w-full fixed top-0 z-20 bg-white">
      <div className="flex items-center justify-between p-3 px-10 ">
        <ul className="flex m-0 p-0 overflow-hidden items-center">
          <Link href="/">
            <li className="float-left mr-8 text-lg font-bold">LeaseX</li>
          </Link>
          <SignedIn>
            {TABS.map((tab, i) => {
              if (!role) return;
              if (tab.roles.includes(role as UserRole)) {
                return (
                  <Link href={tab.href} key={i}>
                    <li
                      className={cn(
                        "float-left mr-4 px-2 rounded hover:bg-gray-200",
                        path.includes(`${tab.href}`) && "bg-gray-200 nav-active"
                      )}
                    >
                      {tab.name}
                    </li>
                  </Link>
                );
              }
            })}
          </SignedIn>
        </ul>
        <SignedIn>
          <div className="flex justify-between gap-4 items-center">
            <div>
              <p className="text-sm font-medium text-right">
                {xTokens} XTokens
              </p>
              {role && (
                <p className="text-sm font-medium text-right">
                  {capitalizeFirstLetter(role)}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {wallet ? (
                <Button disabled>{truncate(wallet, 6, 6, 6)}</Button>
              ) : (
                <Button onClick={connectWallet}>Connect wallet</Button>
              )}
              <UserButton afterSignOutUrl="/login" />
            </div>
          </div>
        </SignedIn>
      </div>
      <hr className="border-slate-400 opacity-25" />
    </nav>
  );
}
