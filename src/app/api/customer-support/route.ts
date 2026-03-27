import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  const url = await getStore().getCustomerSupportUrl();
  return NextResponse.json({ url });
}
