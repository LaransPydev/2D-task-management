import { getSessionUser } from "@/lib/session";
import { loadBoard } from "@/lib/data";
import SignInGate from "@/components/SignInGate";
import App from "@/components/App";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) return <SignInGate />;
  const board = await loadBoard();
  return <App user={user} initialBoard={board} />;
}
