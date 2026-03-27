import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET() {
  const store = getStore();
  const games = await store.games();
  return NextResponse.json(games);
}
