import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getStore();
  const match = await store.getMatch(id);
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  const participants = match.participants ?? [];
  return NextResponse.json(participants, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
