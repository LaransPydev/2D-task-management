"use server";

import { revalidatePath } from "next/cache";
import { isValidRosterName } from "@/lib/domain";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

export async function signInAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") || "").trim();
  // The picker only ever renders buttons for names on the roster, so this
  // only trips on a hand-crafted request -- silently no-op rather than throw.
  if (!isValidRosterName(name)) return;
  await setSessionCookie(name);
  revalidatePath("/");
}

export async function signOutAction(): Promise<void> {
  await clearSessionCookie();
  revalidatePath("/");
}
