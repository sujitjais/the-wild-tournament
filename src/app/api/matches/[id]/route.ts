import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const store = getStore();
  const match = await store.getMatch(id);
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  // Map scheduledAt to startsAt for Android app compatibility
  const { participants: _p, ...matchWithoutParticipants } = match;
  return NextResponse.json({ ...matchWithoutParticipants, startsAt: match.scheduledAt });
}
