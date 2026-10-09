/**
 * Stateless, HMAC-signed session cookie used by the demo mode auth.
 * Web Crypto only, so it works in middleware (Edge) and Node runtimes.
 * In Supabase mode, authentication is handled by Supabase Auth instead.
 */
import type { Role } from "../types";
import { isRole } from "../rbac";

export const SESSION_COOKIE = "dentalcare_session";

interface SessionPayload {
  sub: string;
  email: string;
  role: Role;
  full_name: string;
  exp: number;
}

/**
 * Secret used to sign demo-mode session cookies.
 *
 * AUTH_SECRET must be set for production deployments. When it is missing we
 * fall back to a fixed demo secret so that the Edge middleware and the Node
 * server runtime agree on the same key. Demo mode only ever exposes seeded
 * sample data — set AUTH_SECRET (and Supabase credentials) before going live.
 */
const DEMO_FALLBACK_SECRET = "dentalcare-demo-mode-insecure-secret";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[auth] AUTH_SECRET is not set — using the demo fallback secret. This is safe only in demo mode; set AUTH_SECRET for production.",
    );
  }
  return DEMO_FALLBACK_SECRET;
}

function toBase64Url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Copies bytes into a standalone ArrayBuffer for Web Crypto (BufferSource). */
function toBufferSource(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function signSession(payload: Omit<SessionPayload, "exp">, maxAgeSeconds = 60 * 60 * 24 * 7): Promise<string> {
  const body: SessionPayload = { ...payload, exp: Math.floor(Date.now() / 1000) + maxAgeSeconds };
  const encoded = toBase64Url(JSON.stringify(body));
  const key = await hmacKey(getSecret());
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encoded));
  return `${encoded}.${toBase64Url(sig)}`;
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  try {
    const key = await hmacKey(getSecret());
    const valid = await crypto.subtle.verify("HMAC", key, toBufferSource(fromBase64Url(signature)), new TextEncoder().encode(encoded));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(encoded))) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null;
    if (typeof payload.sub !== "string" || !isRole(payload.role)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
