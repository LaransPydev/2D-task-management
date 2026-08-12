"use server";

import { revalidatePath } from "next/cache";
import { isValidRosterName } from "@/lib/domain";
import { requirePrisma } from "@/lib/prisma";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

export async function signInAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") || "").trim();
  const inRoster = isValidRosterName(name);
  if (!inRoster) {
    const member = await requirePrisma().member.findUnique({ where: { name }, select: { name: true } });
    if (!member) return;
  }
  await setSessionCookie(name);
  revalidatePath("/");
}

export async function signOutAction(): Promise<void> {
  await clearSessionCookie();
  revalidatePath("/");
}
