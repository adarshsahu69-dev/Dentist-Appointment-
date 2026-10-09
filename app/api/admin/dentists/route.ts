import { NextResponse } from "next/server";
import { data } from "@/lib/data";
import { z } from "zod";
import { passwordSchema, phoneSchema } from "@/lib/validation";

const createSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  phone: phoneSchema,
  specialization: z.string().trim().min(2).max(120),
  qualifications: z.string().trim().min(2).max(200),
  experience_years: z.number().int().min(0).max(60),
  biography: z.string().trim().max(1000),
  clinic_id: z.string().uuid(),
  service_ids: z.array(z.string().uuid()).default([]),
  password: passwordSchema,
});

const updateSchema = z.object({
  id: z.string().uuid(),
  specialization: z.string().trim().min(2).max(120).optional(),
  qualifications: z.string().trim().min(2).max(200).optional(),
  experience_years: z.number().int().min(0).max(60).optional(),
  biography: z.string().trim().max(1000).optional(),
  clinic_id: z.string().uuid().optional(),
  is_active: z.boolean().optional(),
  service_ids: z.array(z.string().uuid()).optional(),
  full_name: z.string().trim().min(2).max(80).optional(),
  email: z.string().trim().email().optional(),
});

async function requireAdmin() {
  const user = await data.getSessionUser();
  if (!user || user.role !== "admin") return null;
  return user;
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
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the dentist details and try again." }, { status: 422 });
  }
  const result = await data.createDentist(parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ dentist: result.data }, { status: 201 });
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
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the dentist details and try again." }, { status: 422 });
  }
  const { id, ...patch } = parsed.data;
  const result = await data.updateDentist(id, patch);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 409 });
  return NextResponse.json({ dentist: result.data });
}
