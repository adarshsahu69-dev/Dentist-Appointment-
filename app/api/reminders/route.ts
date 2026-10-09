import { NextResponse } from "next/server";
import { data } from "@/lib/data";

/** Protected with CRON_SECRET (Authorization: Bearer <secret>). */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await data.sendDueReminders();
  return NextResponse.json(result);
}
