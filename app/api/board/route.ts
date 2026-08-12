import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { loadBoard } from "@/lib/data";

export const dynamic = "force-dynamic";

// Polled by the client (SWR) so everyone signed in sees near-live updates
// without needing websockets -- same idea as the original file's
// setInterval(POLL_MS) refresh, just server-backed now.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const board = await loadBoard();
  return NextResponse.json(board);
}
