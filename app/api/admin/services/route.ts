import { NextResponse } from "next/server";
import { data } from "@/lib/data";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(600),
  duration_minutes: z.number().int().min(10).max(240),
  price: z.number().min(0).max(100000).nullable(),
  is_active: z.boolean().default(true),
});

const updateSchema = createSchema.partial().extend({ id: z.string().uuid() });

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
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Check the service details and try again." }, { status: 422 });
  const result = await data.createService(parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ service: result.data }, { status: 201 });
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
  if (!parsed.success) return NextResponse.json({ error: "Check the service details and try again." }, { status: 422 });
  const { id, ...patch } = parsed.data;
  const result = await data.updateService(id, patch);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ service: result.data });
}
