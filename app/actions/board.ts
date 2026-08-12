"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePrisma } from "@/lib/prisma";
import { toProjectRow } from "@/lib/data";
import { getSessionUser } from "@/lib/session";
import {
  DTYPES,
  MARKETS,
  MOVES,
  canAct,
  canEdit,
  isFull,
  isReadonly,
  peopleIn,
  whyNot,
  type SessionUser,
} from "@/lib/domain";

/**
 * Every action re-derives the session user server-side and re-checks the
 * exact same permission gate the UI used to decide whether to show the
 * button. The client is never trusted — see the Server Actions security
 * note this mirrors: https://nextjs.org/docs/app/guides/data-security
 */
async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("Sign in first.");
  return user;
}
function requireNotReadonly(user: SessionUser) {
  if (isReadonly(user)) throw new Error("You are signed in as a Visitor. Switch user to make changes.");
}

async function logEvent(
  projectId: string,
  actor: SessionUser,
  kind: string,
  from: string | null,
  to: string | null,
  note: string | null,
) {
  await requirePrisma().event.create({
    data: { projectId, actor: actor.name, actorRole: actor.role, kind, fromStage: from, toStage: to, note },
  });
}

function afterWrite() {
  revalidatePath("/");
}

/* ============================ CREATE ============================ */
const NewProjectSchema = z.object({
  product: z.string().trim().min(1, "Product name is required."),
  asin: z.string().trim().optional().default(""),
  dtype: z.string().refine((v) => DTYPES.includes(v), "Unknown deliverable type."),
  market: z.string().refine((v) => MARKETS.includes(v), "Unknown market."),
  designer: z.string().trim().min(1, "A designer has to own it, otherwise nobody has the ball."),
  lead: z.string().trim().optional().default(""),
  head: z.string().trim().optional().default(""),
  pm: z.string().trim().optional().default(""),
  priority: z.enum(["high", "med", "low"]).default("med"),
  dueDate: z.string().optional().nullable(),
  note: z.string().trim().optional().default(""),
});
export type NewProjectInput = z.infer<typeof NewProjectSchema>;

export async function createProjectAction(input: NewProjectInput) {
  const user = await requireUser();
  requireNotReadonly(user);
  const data = NewProjectSchema.parse(input);

  const db = requirePrisma();
  const dbMembers = await db.member.findMany({ select: { name: true } });
  const validDesigners = new Set([...peopleIn("designer"), ...dbMembers.map((m) => m.name)]);
  if (!validDesigners.has(data.designer)) throw new Error("Unknown designer.");

  const project = await db.project.create({
    data: {
      product: data.product,
      asin: data.asin,
      dtype: data.dtype,
      market: data.market,
      designer: data.designer,
      lead: data.lead || null,
      head: data.head || null,
      pm: data.pm || null,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      stage: "product",
    },
  });
  await logEvent(project.id, user, "create", null, "product", data.note || `Product selected for ${data.dtype} (${data.market})`);
  afterWrite();
  return toProjectRow(project);
}

/* ============================ MOVE STAGE ============================ */
const MoveSchema = z.object({
  projectId: z.string().uuid(),
  to: z.string(),
  note: z.string().trim().optional().default(""),
  reason: z.string().trim().optional().default(""),
  ticket: z.string().trim().optional().default(""),
});
export type MoveInput = z.infer<typeof MoveSchema>;

export async function moveStageAction(input: MoveInput) {
  const user = await requireUser();
  requireNotReadonly(user);
  const { projectId, to, note: rawNote, reason, ticket } = MoveSchema.parse(input);

  const dbProject = await requirePrisma().project.findUnique({ where: { id: projectId } });
  if (!dbProject) throw new Error("Project not found.");
  const p = toProjectRow(dbProject);

  const mv = (MOVES[p.stage] || []).find((m) => m.to === to);
  if (!mv) throw new Error("That move is not valid from the current stage.");
  if (!canAct(user, p, mv)) throw new Error(whyNot(user, p, mv) + ".");

  let note = rawNote;
  if (to === "amz_rej") {
    if (!reason) throw new Error("Amazon's rejection reason is required.");
    note = "REJECTED — " + reason + (note ? ". " + note : "");
  }
  if (to === "ticket" && !ticket) throw new Error("The ticket ID is how you find the case again later.");
  if (mv.need && !note) throw new Error(mv.need + " — this is what answers “why is it pending”.");

  const patch: Record<string, unknown> = { stage: to, stageSince: new Date() };
  if (to === "lead_fix") patch.revLead = (p.revLead || 0) + 1;
  if (to === "head_fix") patch.revHead = (p.revHead || 0) + 1;
  if (to === "amz_rej") patch.revAmz = (p.revAmz || 0) + 1;
  if (to === "ticket") patch.ticketId = ticket;

  const updated = await requirePrisma().project.update({ where: { id: projectId }, data: patch });
  await logEvent(projectId, user, "stage", p.stage, to, note || null);
  afterWrite();
  return toProjectRow(updated);
}

/* ============================ BLOCK / UNBLOCK ============================ */
const BlockSchema = z.object({ projectId: z.string().uuid(), reason: z.string().trim().min(1, "Say what is blocking it.") });
export async function blockAction(input: z.infer<typeof BlockSchema>) {
  const user = await requireUser();
  requireNotReadonly(user);
  const { projectId, reason } = BlockSchema.parse(input);
  const dbProject = await requirePrisma().project.findUnique({ where: { id: projectId } });
  if (!dbProject) throw new Error("Project not found.");
  const p = toProjectRow(dbProject);
  if (!canEdit(user, p)) throw new Error("You can only flag your own projects (or your team's) as blocked.");

  const updated = await requirePrisma().project.update({ where: { id: projectId }, data: { blocked: true, blockReason: reason } });
  await logEvent(projectId, user, "block", p.stage, p.stage, reason);
  afterWrite();
  return toProjectRow(updated);
}

const UnblockSchema = z.object({ projectId: z.string().uuid(), note: z.string().trim().optional().default("") });
export async function unblockAction(input: z.infer<typeof UnblockSchema>) {
  const user = await requireUser();
  requireNotReadonly(user);
  const { projectId, note } = UnblockSchema.parse(input);
  const dbProject = await requirePrisma().project.findUnique({ where: { id: projectId } });
  if (!dbProject) throw new Error("Project not found.");
  const p = toProjectRow(dbProject);
  if (!canEdit(user, p)) throw new Error("You can only clear a block on your own projects (or your team's).");

  const updated = await requirePrisma().project.update({ where: { id: projectId }, data: { blocked: false, blockReason: "" } });
  await logEvent(projectId, user, "unblock", p.stage, p.stage, note || "Block cleared");
  afterWrite();
  return toProjectRow(updated);
}

/* ============================ EDIT ============================ */
const EditSchema = z.object({
  projectId: z.string().uuid(),
  product: z.string().trim().optional(),
  asin: z.string().trim().optional(),
  dtype: z.string().optional(),
  market: z.string().optional(),
  priority: z.enum(["high", "med", "low"]).optional(),
  designer: z.string().trim().optional(),
  dueDate: z.string().optional().nullable(),
  ticketId: z.string().trim().optional(),
  lead: z.string().trim().optional(),
  head: z.string().trim().optional(),
  pm: z.string().trim().optional(),
  briefUrl: z.string().trim().optional(),
  workUrl: z.string().trim().optional(),
});
export type EditInput = z.infer<typeof EditSchema>;

export async function editAction(input: EditInput) {
  const user = await requireUser();
  requireNotReadonly(user);
  const data = EditSchema.parse(input);
  const dbProject = await requirePrisma().project.findUnique({ where: { id: data.projectId } });
  if (!dbProject) throw new Error("Project not found.");
  const p = toProjectRow(dbProject);
  if (!canEdit(user, p)) throw new Error("You can only edit your own projects.");

  const patch: Record<string, unknown> = {};
  const changed: string[] = [];
  const fields: (keyof EditInput)[] = ["product", "asin", "dtype", "market", "priority", "designer", "ticketId", "lead", "head", "pm", "briefUrl", "workUrl"];
  for (const f of fields) {
    if (data[f] === undefined) continue;
    const current = (p as unknown as Record<string, unknown>)[f] ?? "";
    if (String(data[f] ?? "") !== String(current)) {
      patch[f] = data[f];
      changed.push(f);
    }
  }
  if (data.dueDate !== undefined) {
    const newDue = data.dueDate ? new Date(data.dueDate) : null;
    if ((newDue?.toISOString().slice(0, 10) ?? null) !== p.dueDate) {
      patch.dueDate = newDue;
      changed.push("dueDate");
    }
  }

  const updated = await requirePrisma().project.update({ where: { id: data.projectId }, data: patch });
  if (changed.length) await logEvent(data.projectId, user, "edit", p.stage, p.stage, "Updated: " + changed.join(", "));
  afterWrite();
  return { project: toProjectRow(updated), changed: changed.length };
}

/* ============================ COMMENT ============================ */
const CommentSchema = z.object({ projectId: z.string().uuid(), text: z.string().trim().min(1) });
export async function commentAction(input: z.infer<typeof CommentSchema>) {
  const user = await requireUser();
  requireNotReadonly(user);
  const { projectId, text } = CommentSchema.parse(input);
  const db = requirePrisma();
  const exists = await db.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!exists) throw new Error("Project not found.");
  const comment = await db.comment.create({ data: { projectId, actor: user.name, actorRole: user.role, text } });
  afterWrite();
  return { id: comment.id, projectId, at: comment.at.toISOString(), actor: comment.actor, actorRole: comment.actorRole, text: comment.text };
}

/* ============================ VIEW ============================ */
export async function logViewAction(projectId: string) {
  const user = await getSessionUser();
  if (!user) return; // visitors who aren't signed in — silently skip
  const db = requirePrisma();
  const exists = await db.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!exists) return;
  await logEvent(projectId, user, "view", null, null, null);
  // no revalidatePath — a view shouldn't trigger a full board refresh
}

/* ============================ MANAGE DELIVERABLE TYPES & MARKETS ============================ */
const NameSchema = z.object({ name: z.string().trim().min(1).max(60) });

export async function addDeliverableTypeAction(input: z.infer<typeof NameSchema>) {
  const user = await requireUser();
  if (user.role !== "lead" && user.role !== "head" && user.role !== "pm")
    throw new Error("Only Team Lead, Team Head, or Project Manager can add deliverable types.");
  const { name } = NameSchema.parse(input);
  const db = requirePrisma();
  const exists = await db.deliverableType.findUnique({ where: { name } });
  if (exists) throw new Error(`"${name}" already exists.`);
  await db.deliverableType.create({ data: { id: crypto.randomUUID(), name, createdBy: user.name } });
  afterWrite();
}

export async function removeDeliverableTypeAction(name: string) {
  const user = await requireUser();
  if (user.role !== "lead" && user.role !== "head" && user.role !== "pm")
    throw new Error("Only Team Lead, Team Head, or Project Manager can remove deliverable types.");
  await requirePrisma().deliverableType.delete({ where: { name } });
  afterWrite();
}

export async function addMarketAction(input: z.infer<typeof NameSchema>) {
  const user = await requireUser();
  if (user.role !== "lead" && user.role !== "head" && user.role !== "pm")
    throw new Error("Only Team Lead, Team Head, or Project Manager can add markets.");
  const { name } = NameSchema.parse(input);
  const db = requirePrisma();
  const exists = await db.market.findUnique({ where: { name } });
  if (exists) throw new Error(`"${name}" already exists.`);
  await db.market.create({ data: { id: crypto.randomUUID(), name, createdBy: user.name } });
  afterWrite();
}

export async function removeMarketAction(name: string) {
  const user = await requireUser();
  if (user.role !== "lead" && user.role !== "head" && user.role !== "pm")
    throw new Error("Only Team Lead, Team Head, or Project Manager can remove markets.");
  await requirePrisma().market.delete({ where: { name } });
  afterWrite();
}

/* ============================ MANAGE DESIGNERS ============================ */
const AddDesignerSchema = z.object({ name: z.string().trim().min(2).max(60) });

export async function addDesignerAction(input: z.infer<typeof AddDesignerSchema>) {
  const user = await requireUser();
  if (user.role !== "lead" && user.role !== "head" && user.role !== "pm")
    throw new Error("Only Team Lead, Team Head, or Project Manager can add designers.");
  const { name } = AddDesignerSchema.parse(input);
  const db = requirePrisma();
  const exists = await db.member.findUnique({ where: { name } });
  if (exists) throw new Error(`"${name}" is already in the roster.`);
  await db.member.create({ data: { id: crypto.randomUUID(), name, createdBy: user.name } });
  afterWrite();
}

export async function removeDesignerAction(name: string) {
  const user = await requireUser();
  if (user.role !== "lead" && user.role !== "head" && user.role !== "pm")
    throw new Error("Only Team Lead, Team Head, or Project Manager can remove designers.");
  await requirePrisma().member.delete({ where: { name } });
  afterWrite();
}

/* ============================ DELETE / WIPE ============================ */
export async function deleteProjectAction(projectId: string) {
  const user = await requireUser();
  if (!isFull(user)) throw new Error("Only the Team Head or Project Manager can delete a project.");
  await requirePrisma().project.delete({ where: { id: projectId } }); // events/comments cascade
  afterWrite();
  return { ok: true };
}

export async function wipeAllAction(confirm: string) {
  const user = await requireUser();
  if (!isFull(user)) throw new Error("Only the Team Head or Project Manager can clear the board.");
  if (confirm.trim().toUpperCase() !== "DELETE") throw new Error("Type DELETE exactly, so this cannot happen by accident.");
  const { count } = await requirePrisma().project.deleteMany({});
  afterWrite();
  return { count };
}
