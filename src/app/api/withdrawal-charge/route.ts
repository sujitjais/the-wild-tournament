import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  const chargePercent = await getStore().getWithdrawalCharge();
  return NextResponse.json({ chargePercent });
}
