import { getSessionUser } from "@/lib/session";
import { loadBoard, loadMembers } from "@/lib/data";
import SignInGate from "@/components/SignInGate";
import App from "@/components/App";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getSessionUser();
  if (!user) {
    const designers = await loadMembers();
    return <SignInGate designers={designers} />;
  }
  const board = await loadBoard();
  return <App user={user} initialBoard={board} />;
}
