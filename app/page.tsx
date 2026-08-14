import { getSessionUser } from "@/lib/session";
import { loadBoard } from "@/lib/data";
import SignInGate from "@/components/SignInGate";
import App from "@/components/App";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) return <SignInGate />;
  const board = await loadBoard(user.role === "head" || user.role === "pm");
  return <App user={user} initialBoard={board} />;
}
