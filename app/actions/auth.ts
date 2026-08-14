"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePrisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clearSessionCookie, getSessionUser, setSessionCookie } from "@/lib/session";

const passwordSchema = z.string().min(6, "Password must be at least 6 characters.").max(128);
const usernameSchema = z.string().trim().toLowerCase().min(3).max(40).regex(/^[a-z0-9._-]+$/, "Use only letters, numbers, dots, underscores, or hyphens.");
const emailSchema = z.union([z.literal(""), z.string().trim().toLowerCase().email("Enter a valid email address.")]);
const roleSchema = z.enum(["designer", "lead", "head", "pm", "visitor"]);

export interface SignInState {
  error: string | null;
}

export async function signInAction(_state: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = z.object({
    identifier: z.string().trim().toLowerCase().min(1, "Enter your username or email."),
    password: z.string().min(1, "Enter your password."),
  }).safeParse({ identifier: formData.get("identifier"), password: formData.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid credentials." };

  const db = requirePrisma();
  const member = await db.member.findFirst({
    where: { OR: [{ username: parsed.data.identifier }, { email: parsed.data.identifier }] },
    select: { id: true, passwordHash: true },
  });
  if (!member) {
    await hashPassword(parsed.data.password);
    return { error: "Invalid username/email or password." };
  }
  if (!member.passwordHash) return { error: "Your password has not been set. Contact a Team Head or Project Manager." };
  if (!(await verifyPassword(parsed.data.password, member.passwordHash))) {
    return { error: "Invalid username/email or password." };
  }

  await setSessionCookie(member.id);
  revalidatePath("/");
  return { error: null };
}

export async function visitorSignInAction(_state: SignInState): Promise<SignInState> {
  void _state;
  const visitor = await requirePrisma().member.findFirst({
    where: { role: "visitor" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!visitor) return { error: "Visitor access is not available. Contact a Team Head or Project Manager." };

  await setSessionCookie(visitor.id);
  revalidatePath("/");
  return { error: null };
}

async function requireCredentialAdmin() {
  const user = await getSessionUser();
  if (!user || (user.role !== "head" && user.role !== "pm")) {
    throw new Error("Only Team Heads and Project Managers can manage user credentials.");
  }
  return user;
}

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(60),
  username: usernameSchema,
  email: emailSchema,
  role: roleSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export type CreateUserInput = z.input<typeof createUserSchema>;

export async function createUserAction(input: CreateUserInput) {
  const actor = await requireCredentialAdmin();
  const data = createUserSchema.parse(input);
  try {
    await requirePrisma().member.create({
      data: {
        name: data.name,
        username: data.username,
        email: data.email || null,
        role: data.role,
        passwordHash: await hashPassword(data.password),
        passwordUpdatedAt: new Date(),
        createdBy: actor.name,
      },
    });
  } catch {
    throw new Error("That name, username, or email is already in use.");
  }
  revalidatePath("/");
}

const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2).max(60),
  username: usernameSchema,
  email: emailSchema,
  role: roleSchema,
});

export type UpdateUserInput = z.input<typeof updateUserSchema>;

export async function updateUserAction(input: UpdateUserInput) {
  await requireCredentialAdmin();
  const data = updateUserSchema.parse(input);
  const db = requirePrisma();
  const current = await db.member.findUnique({ where: { id: data.id }, select: { role: true } });
  if (!current) throw new Error("User not found.");
  if ((current.role === "head" || current.role === "pm") && data.role !== "head" && data.role !== "pm") {
    const adminCount = await db.member.count({ where: { role: { in: ["head", "pm"] } } });
    if (adminCount <= 1) throw new Error("At least one Team Head or Project Manager must remain.");
  }
  try {
    const member = await db.member.findUnique({ where: { id: data.id }, select: { name: true } });
    if (!member) throw new Error("User not found.");
    await db.$transaction([
      db.member.update({
        where: { id: data.id },
        data: { name: data.name, username: data.username, email: data.email || null, role: data.role },
      }),
      db.project.updateMany({ where: { designer: member.name }, data: { designer: data.name } }),
      db.project.updateMany({ where: { lead: member.name }, data: { lead: data.name } }),
      db.project.updateMany({ where: { head: member.name }, data: { head: data.name } }),
      db.project.updateMany({ where: { pm: member.name }, data: { pm: data.name } }),
    ]);
  } catch {
    throw new Error("That name, username, or email is already in use.");
  }
  revalidatePath("/");
}

const setUserPasswordSchema = z.object({
  id: z.string().min(1),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export async function setUserPasswordAction(input: z.input<typeof setUserPasswordSchema>) {
  await requireCredentialAdmin();
  const data = setUserPasswordSchema.parse(input);
  await requirePrisma().member.update({
    where: { id: data.id },
    data: { passwordHash: await hashPassword(data.password), passwordUpdatedAt: new Date() },
  });
  revalidatePath("/");
}

const updateOwnAccountSchema = z.object({
  name: z.string().trim().min(2).max(60),
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword: z.union([z.literal(""), passwordSchema]),
});

export type UpdateOwnAccountInput = z.input<typeof updateOwnAccountSchema>;

export async function updateOwnAccountAction(input: UpdateOwnAccountInput) {
  const user = await getSessionUser();
  if (!user) throw new Error("Sign in first.");
  const data = updateOwnAccountSchema.parse(input);
  const db = requirePrisma();
  const member = await db.member.findUnique({
    where: { id: user.id },
    select: { name: true, passwordHash: true },
  });
  if (!member?.passwordHash || !(await verifyPassword(data.currentPassword, member.passwordHash))) {
    throw new Error("Current password is incorrect.");
  }

  const memberData = {
    name: data.name,
    ...(data.newPassword ? {
      passwordHash: await hashPassword(data.newPassword),
      passwordUpdatedAt: new Date(),
    } : {}),
  };

  try {
    await db.$transaction([
      db.member.update({ where: { id: user.id }, data: memberData }),
      db.project.updateMany({ where: { designer: member.name }, data: { designer: data.name } }),
      db.project.updateMany({ where: { lead: member.name }, data: { lead: data.name } }),
      db.project.updateMany({ where: { head: member.name }, data: { head: data.name } }),
      db.project.updateMany({ where: { pm: member.name }, data: { pm: data.name } }),
    ]);
  } catch {
    throw new Error("That name is already in use.");
  }
  revalidatePath("/");
}

export async function deleteUserAction(id: string) {
  const actor = await requireCredentialAdmin();
  const db = requirePrisma();
  const member = await db.member.findUnique({ where: { id }, select: { role: true } });
  if (!member) throw new Error("User not found.");
  if (id === actor.id) throw new Error("You cannot delete your own signed-in account.");
  if (member.role === "head" || member.role === "pm") {
    const adminCount = await db.member.count({ where: { role: { in: ["head", "pm"] } } });
    if (adminCount <= 1) throw new Error("At least one Team Head or Project Manager must remain.");
  }
  await db.member.delete({ where: { id } });
  revalidatePath("/");
}

export async function signOutAction(): Promise<void> {
  await clearSessionCookie();
  revalidatePath("/");
}
