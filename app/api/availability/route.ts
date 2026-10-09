import { NextResponse } from "next/server";
import { data } from "@/lib/data";
import { dayOfWeek } from "@/lib/availability";

/** GET /api/availability?dentistId=&serviceId=&date=YYYY-MM-DD */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dentistId = searchParams.get("dentistId");
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date");

  if (!dentistId || !serviceId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "dentistId, serviceId and a valid date are required." }, { status: 400 });
  }

  const [dentist, service] = await Promise.all([data.getDentist(dentistId), data.getService(serviceId)]);
  if (!dentist || !service) {
    return NextResponse.json({ error: "Unknown dentist or service." }, { status: 404 });
  }

  const slots = await data.getSlotsFor(dentistId, serviceId, date);
  return NextResponse.json({
    dentist_id: dentistId,
    service_id: serviceId,
    date,
    weekday: dayOfWeek(date),
    duration_minutes: service.duration_minutes,
    slots,
  });
}
