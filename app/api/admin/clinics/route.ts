import { NextResponse } from "next/server";
import { data } from "@/lib/data";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(40),
  postal_code: z.string().trim().min(3).max(20),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  phone: z.string().trim().min(5).max(30),
  opening_hours: z.string().trim().min(3).max(200),
});

const updateSchema = schema.partial().extend({ id: z.string().uuid() });

async function requireAdmin() {
  const user = await data.getSessionUser();
  return user?.role === "admin" ? user : null;
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the clinic details and try again." }, { status: 422 });
  const result = await data.createClinic(parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ clinic: result.data }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the clinic details and try again." }, { status: 422 });
  const { id, ...patch } = parsed.data;
  const result = await data.updateClinic(id, patch);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ clinic: result.data });
}
