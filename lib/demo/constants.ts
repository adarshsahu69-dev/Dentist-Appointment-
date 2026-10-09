/** Constants shared by client and server demo-mode code (no Node APIs). */
export const DEMO_PASSWORD = "Password123";

export const DEMO_ACCOUNTS = {
  patient: { email: "patient@demo.com", password: DEMO_PASSWORD },
  dentist: { email: "dentist@demo.com", password: DEMO_PASSWORD },
  admin: { email: "admin@demo.com", password: DEMO_PASSWORD },
};

/** Deterministic, schema-compatible UUIDs for seed data. */
export function seedId(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}
