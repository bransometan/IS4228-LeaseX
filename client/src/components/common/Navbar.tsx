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
    <nav className="w-full fixed top-0 z-20 bg-white shadow-md border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-3 max-w-screen-2xl mx-auto">
        <ul className="flex items-center space-x-6">
          <Link href="/">
            <li className="text-xl font-extrabold text-indigo-600 tracking-wide cursor-pointer">
              LeaseX
            </li>
          </Link>
          <SignedIn>
            {TABS.map((tab, i) => {
              if (!role) return null;
              if (tab.roles.includes(role as UserRole)) {
                return (
                  <Link href={tab.href} key={i}>
                    <li
                      className={cn(
                        "text-sm font-medium px-3 py-2 rounded-md transition-all duration-200 cursor-pointer hover:bg-indigo-100 hover:text-indigo-600",
                        path.includes(`${tab.href}`) &&
                          "bg-indigo-100 text-indigo-600"
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
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-700">{xTokens} XTokens</p>
              {role && (
                <p className="text-xs text-gray-500">
                  {capitalizeFirstLetter(role)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {wallet ? (
                <Button
                  variant="outline"
                  className="text-sm font-mono px-4 py-1"
                  disabled
                >
                  {truncate(wallet, 6, 6, 6)}
                </Button>
              ) : (
                <Button onClick={connectWallet}>Connect Wallet</Button>
              )}
              <UserButton afterSignOutUrl="/login" />
            </div>
          </div>
        </SignedIn>
      </div>
    </nav>
  );
}
