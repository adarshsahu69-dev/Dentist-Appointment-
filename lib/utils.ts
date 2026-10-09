import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SERVICES_ICON = "services";

export const APPOINTMENT_STATUSES = ["pending", "confirmed", "completed", "cancelled", "no_show"] as const;
