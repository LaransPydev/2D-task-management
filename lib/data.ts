import "server-only";
import { prisma } from "./prisma";
import type { CommentRow, EventRow, ProjectRow } from "./domain";
import type { Project as DbProject, Event as DbEvent, Comment as DbComment } from "@/app/generated/prisma/client";

// Maps Prisma rows (Date objects, nullable fks) to the plain JSON-safe shape
// the rest of the app (and every Client Component) works with.

export function toProjectRow(p: DbProject): ProjectRow {
  return {
    id: p.id,
    product: p.product,
    asin: p.asin,
    dtype: p.dtype,
    market: p.market,
    designer: p.designer,
    lead: p.lead,
    head: p.head,
    pm: p.pm,
    stage: p.stage,
    priority: p.priority,
    dueDate: p.dueDate ? p.dueDate.toISOString().slice(0, 10) : null,
    createdAt: p.createdAt.toISOString(),
    stageSince: p.stageSince.toISOString(),
    ticketId: p.ticketId,
    ticketUrl: p.ticketUrl,
    briefUrl: p.briefUrl,
    workUrl: p.workUrl,
    blocked: p.blocked,
    blockReason: p.blockReason,
    revLead: p.revLead,
    revHead: p.revHead,
    revAmz: p.revAmz,
  };
}
export function toEventRow(e: DbEvent): EventRow {
  return {
    id: e.id,
    projectId: e.projectId,
    at: e.at.toISOString(),
    actor: e.actor,
    actorRole: e.actorRole,
    kind: e.kind,
    fromStage: e.fromStage,
    toStage: e.toStage,
    note: e.note,
  };
}
export function toCommentRow(c: DbComment): CommentRow {
  return {
    id: c.id,
    projectId: c.projectId,
    at: c.at.toISOString(),
    actor: c.actor,
    actorRole: c.actorRole,
    text: c.text,
  };
}

export interface BoardData {
  projects: ProjectRow[];
  events: EventRow[];
  comments: CommentRow[];
  designers: string[];
  dbDtypes: string[];
  dbMarkets: string[];
}

/** Everything the pipeline UI needs, in one round trip. Small team + small
 *  project count (dozens, not millions of rows) so loading the full event/
 *  comment history up front is simpler and fast enough — same as the
 *  original file's approach. Revisit with pagination if the team's history
 *  grows into the thousands of events. */
const emptyBoard: BoardData = {
  projects: [],
  events: [],
  comments: [],
  designers: [],
  dbDtypes: [],
  dbMarkets: [],
};

export async function loadBoard(): Promise<BoardData> {
  if (!prisma) return emptyBoard;
  try {
    const [projects, events, comments, dbMembers, dbDtypeRows, dbMarketRows] = await Promise.all([
      prisma.project.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.event.findMany({ orderBy: { at: "asc" } }),
      prisma.comment.findMany({ orderBy: { at: "asc" } }),
      prisma.member.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.deliverableType.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.market.findMany({ orderBy: { createdAt: "asc" } }),
    ]);
    return {
      projects: projects.map(toProjectRow),
      events: events.map(toEventRow),
      comments: comments.map(toCommentRow),
      designers: dbMembers.map((m) => m.name),
      dbDtypes: dbDtypeRows.map((d) => d.name),
      dbMarkets: dbMarketRows.map((m) => m.name),
    };
  } catch {
    console.error("Database unavailable — rendering empty board.");
    return emptyBoard;
  }
}
