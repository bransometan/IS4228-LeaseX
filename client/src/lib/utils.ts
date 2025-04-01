import { ActiveSessionResource } from "@clerk/types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Truncates a text based on the maxLength
 * @param text
 * @param startChars
 * @param endChars
 * @param maxLength
 * @returns truncated string
 */
export function truncate(
  text: string,
  startChars: number,
  endChars: number,
  maxLength: number
): string {
  if (text.length > maxLength) {
    let start = text.substring(0, startChars);
    let end = text.substring(text.length - endChars, text.length);
    while (start.length + end.length < maxLength) {
      start = start + ".";
    }
    return [start + end, "..."].join("");
  }
  return text;
}

export function capitalizeFirstLetter(str: string) {
  return [str[0].toUpperCase(), str.slice(1)].join("");
}

export function enumValueToIndex(enumeration: any, value: any) {
  return Object.values(enumeration).indexOf(value);
}

export function checkUserRole(
  session: ActiveSessionResource | null | undefined
) {
  if (
    !session ||
    !session.user ||
    !session.user.organizationMemberships ||
    session.user.organizationMemberships.length === 0
  ) {
    return null; // Return null if the user is not a basic member
  }

  const organizationMemberships = session.user.organizationMemberships;

  // Loop through all organization memberships
  for (const membership of organizationMemberships) {
    if (membership.role) {
      return membership.role.toLowerCase().split(":")[1]; // Return the role in lowercase if it exists
    }
  }

  return null; // Return null if no role is found in the memberships
}

/**
 * Format date to return e.g 14 Apr 2024 12:53 pm
 * @param date Date
 * @returns string of date
 */
export function formatDateForDispute(date: Date) {
  return format(date, "d LLL yyyy h:mm aaa");
}
