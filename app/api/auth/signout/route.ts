import { NextResponse } from "next/server";
import { data } from "@/lib/data";

export async function POST() {
  await data.signOut();
  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"), 303);
}
