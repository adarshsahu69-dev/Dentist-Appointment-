import { NextResponse } from "next/server";
import { data } from "@/lib/data";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const dentist = await data.getDentist(params.id);
  if (!dentist) return NextResponse.json({ error: "Dentist not found." }, { status: 404 });
  const blocked_dates = await data.listBlockedDates(params.id);
  return NextResponse.json({ blocked_dates });
}
