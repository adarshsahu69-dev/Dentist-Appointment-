import { isDemoMode } from "../config";
import { demoProvider } from "./demo";
import { supabaseProvider } from "./supabase";
import type { DataProvider } from "./provider";

/**
 * Single entry point for all data access.
 * When Supabase is not configured the app runs in demo mode with seeded
 * in-memory data; every write still goes through the same validation and
 * concurrency rules as production.
 */
export const data: DataProvider = isDemoMode ? demoProvider : supabaseProvider;

export * from "./provider";
