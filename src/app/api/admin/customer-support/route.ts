import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { getAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!admin.usersAccess) return NextResponse.json({ error: "No users access" }, { status: 403 });
  const url = await getStore().getCustomerSupportUrl();
  return NextResponse.json({ url });
}

export async function PATCH(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!admin.usersAccess) return NextResponse.json({ error: "No users access" }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const url = typeof body.url === "string" ? body.url.trim() || null : null;
  const store = getStore();
  await store.setCustomerSupportUrl(url);
  const updated = await store.getCustomerSupportUrl();
  return NextResponse.json({ url: updated });
}
