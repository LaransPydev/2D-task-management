/**
 * Sportstech Creative Ops — domain layer.
 *
 * Ported straight from the original single-file app's STAGES / ROLES / ROSTER /
 * MOVES / permission logic. This file is framework-agnostic (no Next.js, no
 * Prisma, no DOM) so it's safe to import from Server Components, Server
 * Actions, and Client Components alike.
 *
 * The roster, roles, stages and move-graph are fixed config, not DB rows —
 * same as the original file. There is deliberately no way for a signed-in
 * person to grant themselves a role or invent a stage transition, because
 * there's no row anyone can insert. If that needs to change later (e.g. an
 * admin screen for managing the roster), promote ROSTER to a real table.
 */

export const INK = "#25282A";
export const GREY = "#8E9294";

export type RoleId = "designer" | "lead" | "head" | "pm" | "visitor";
export type StageOwner = "pm" | "designer" | "lead" | "head" | "amazon" | "none";

export interface Stage {
  id: string;
  n: number;
  label: string;
  short: string;
  owner: StageOwner;
  c: string;
}

export const STAGES: Stage[] = [
  { id: "product", n: 1, label: "Product Selected", short: "Product", owner: "pm", c: "#C7DFF8" },
  { id: "concept", n: 2, label: "Concept Development", short: "Concept", owner: "designer", c: "#ADD0F4" },
  { id: "design", n: 3, label: "Design", short: "Design", owner: "designer", c: "#93C2F1" },
  { id: "lead_rev", n: 4, label: "Review · Team Lead", short: "Lead Review", owner: "lead", c: "#79B3EE" },
  { id: "lead_fix", n: 5, label: "Revision · Lead Notes", short: "Lead Revision", owner: "designer", c: INK },
  { id: "head_rev", n: 6, label: "Review · Team Head", short: "Head Review", owner: "head", c: "#5FA5EA" },
  { id: "head_fix", n: 7, label: "Revision · Head Notes", short: "Head Revision", owner: "designer", c: INK },
  { id: "live_req", n: 8, label: "Live Request Raised", short: "Live Request", owner: "pm", c: "#4597E7" },
  { id: "ticket", n: 9, label: "Ticket Created", short: "Ticket", owner: "pm", c: "#2B88E5" },
  { id: "amz_rev", n: 10, label: "Amazon Review", short: "Amazon Review", owner: "amazon", c: GREY },
  { id: "amz_rej", n: 11, label: "Amazon Rejected · Rework", short: "Rejected", owner: "designer", c: INK },
  { id: "done", n: 12, label: "Live · Completed", short: "Live", owner: "none", c: "#0071E3" },
];
export const S: Record<string, Stage> = {};
STAGES.forEach((s) => (S[s.id] = s));

export const LOOPS = new Set(["lead_fix", "head_fix", "amz_rej"]);
export const RAIL = ["product", "concept", "design", "lead_rev", "head_rev", "live_req", "ticket", "amz_rev", "done"];
export const LOOP_ANCHOR: Record<string, string> = { lead_fix: "lead_rev", head_fix: "head_rev", amz_rej: "amz_rev" };

/** Who may fire a move: D = the assigned designer only, L = the assigned lead only, [] = Head/PM only (they always pass anyway). */
const D: RoleId[] = ["designer"];
const L: RoleId[] = ["lead"];
const HP: RoleId[] = [];

export interface Move {
  to: string;
  lb: string;
  st: "pri" | "ok" | "warn" | "bad" | "gh";
  roles: RoleId[];
  need?: string;
}
export const MOVES: Record<string, Move[]> = {
  product: [{ to: "concept", lb: "Start concept", st: "pri", roles: D }],
  concept: [{ to: "design", lb: "Concept done → design", st: "pri", roles: D }],
  design: [{ to: "lead_rev", lb: "Submit to Team Lead", st: "pri", roles: D }],
  lead_rev: [
    { to: "head_rev", lb: "Approve → Team Head", st: "ok", roles: L },
    { to: "lead_fix", lb: "Request revision", st: "warn", roles: L, need: "Corrections for the designer" },
  ],
  lead_fix: [{ to: "lead_rev", lb: "Revision done → Lead", st: "pri", roles: D }],
  head_rev: [
    { to: "live_req", lb: "Approve → go live", st: "ok", roles: HP },
    { to: "head_fix", lb: "Request revision", st: "warn", roles: HP, need: "Corrections for the designer" },
  ],
  head_fix: [{ to: "head_rev", lb: "Revision done → Head", st: "pri", roles: D }],
  live_req: [{ to: "ticket", lb: "Ticket created", st: "pri", roles: HP, need: "Ticket ID / link" }],
  ticket: [{ to: "amz_rev", lb: "Submitted to Amazon", st: "pri", roles: HP }],
  amz_rev: [
    { to: "done", lb: "Amazon approved → LIVE", st: "ok", roles: HP },
    { to: "amz_rej", lb: "Amazon rejected", st: "bad", roles: HP, need: "Amazon rejection reason" },
  ],
  amz_rej: [{ to: "design", lb: "Rework design", st: "pri", roles: D }],
  done: [{ to: "design", lb: "Reopen for rework", st: "gh", roles: HP, need: "Why is a live asset being reopened?" }],
};

export interface Role {
  id: RoleId;
  lb: string;
  tier: number;
  d: string;
}
export const ROLES: Role[] = [
  { id: "designer", lb: "Designer", tier: 1, d: "own concepts, design & revisions" },
  { id: "lead", lb: "Team Lead", tier: 2, d: "first approval gate" },
  { id: "head", lb: "Team Head", tier: 3, d: "final gate · full control" },
  { id: "pm", lb: "Project Manager", tier: 3, d: "live requests, tickets · full control" },
  { id: "visitor", lb: "Visitor", tier: 0, d: "read-only — sees everything, changes nothing" },
];

export interface Person {
  name: string;
  role: RoleId;
}
/** The team. Only these people can sign in — there is no free-text name box,
 *  so nobody can award themselves a role they do not hold. Edit this list
 *  (a code change, reviewed like any other) to add/remove teammates. */
export const ROSTER: Person[] = [
  { name: "Vishnu Kumar", role: "designer" },
  { name: "Vishnu Varthini", role: "designer" },
  { name: "Onish", role: "designer" },
  { name: "Asrafdeen", role: "designer" },
  { name: "Abirami", role: "designer" },
  { name: "Sanjay Kumar", role: "lead" },
  { name: "Vimalraj", role: "lead" },
  { name: "Thomas", role: "head" },
  { name: "Lingesvar", role: "head" },
  { name: "Kowsi", role: "pm" },
  { name: "Visitor", role: "visitor" },
];
export const TEAM_SIZE = ROSTER.filter((p) => p.role !== "visitor").length;


export const REJECT_REASONS = [
  "Text/claim not allowed",
  "Image quality / resolution",
  "White background rule",
  "Logo or watermark issue",
  "Wrong product shown",
  "Prohibited claim (health)",
  "Trademark / IP flag",
  "No reason given",
];

export const AGE_WARN = 3; // days in one stage before amber
export const AGE_CRIT = 6; // days in one stage before red
export const WIP_LIMIT = 3; // active projects per designer before it flags

export function roleOf(name: string): RoleId {
  return ROSTER.find((p) => p.name === name)?.role ?? "designer";
}
export function roleLb(r: string): string {
  return ROLES.find((x) => x.id === r)?.lb ?? r;
}
export function peopleIn(r: RoleId): string[] {
  return ROSTER.filter((p) => p.role === r).map((p) => p.name);
}
export function isValidRosterName(name: string): boolean {
  return ROSTER.some((p) => p.name === name);
}

export interface SessionUser {
  name: string;
  role: RoleId;
}

export function isReadonly(user: SessionUser | null): boolean {
  return !user || user.role === "visitor";
}
/** Head + PM override every gate. */
export function isFull(user: SessionUser | null): boolean {
  return !!user && (user.role === "head" || user.role === "pm");
}

/* ============================ PROJECT SHAPE ============================ */
// Plain, JSON-safe shape (dates as ISO strings) shared between server data
// loading and client components. Prisma rows get mapped into this at the
// data-access boundary (see lib/data.ts) rather than passed through raw.
export interface ProjectRow {
  id: string;
  product: string;
  asin: string;
  dtype: string;
  market: string;
  designer: string | null;
  lead: string | null;
  head: string | null;
  pm: string | null;
  stage: string;
  priority: "high" | "med" | "low" | string;
  dueDate: string | null;
  createdAt: string;
  stageSince: string;
  ticketId: string;
  ticketUrl: string;
  briefUrl: string;
  workUrl: string;
  blocked: boolean;
  blockReason: string;
  revLead: number;
  revHead: number;
  revAmz: number;
}
export interface EventRow {
  id: string;
  projectId: string;
  at: string;
  actor: string;
  actorRole: string;
  kind: "create" | "stage" | "comment" | "block" | "unblock" | "edit" | string;
  fromStage: string | null;
  toStage: string | null;
  note: string | null;
}
export interface CommentRow {
  id: string;
  projectId: string;
  at: string;
  actor: string;
  actorRole: string;
  text: string;
}

export const DAY = 86400000;

export function daysBetween(a: string | Date, b: number = Date.now()): number {
  return Math.max(0, Math.floor((b - new Date(a).getTime()) / DAY));
}
export function hoursBetween(a: string | Date, b: number = Date.now()): number {
  return Math.max(0, (b - new Date(a).getTime()) / 3600000);
}
export function monthKey(d: string | Date): string {
  const x = new Date(d);
  return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0");
}
export function monthLabel(k: string): string {
  const [y, m] = k.split("-");
  return (
    new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-GB", { month: "short" }) + " '" + String(y).slice(2)
  );
}
export function ago(iso: string): string {
  const h = hoursBetween(iso);
  if (h < 1) return Math.max(1, Math.round(h * 60)) + "m ago";
  if (h < 24) return Math.round(h) + "h ago";
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : d + "d ago";
}
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}
export function fmtStamp(iso: string): string {
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) +
    " · " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
}
export function initials(n: string | null | undefined): string {
  return String(n || "?")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
export function avColor(n: string | null | undefined): string {
  let h = 0;
  for (const ch of String(n || "")) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(205 7% ${91 - (h % 4) * 4}%)`;
}

export function pct(a: number, b: number): number {
  return b > 0 ? Math.round((a / b) * 100) : 0;
}
export function avg(arr: number[]): number {
  return arr.length ? arr.reduce((x, y) => x + y, 0) / arr.length : 0;
}

export function isActive(p: ProjectRow): boolean {
  return p.stage !== "done";
}
export function isOverdue(p: ProjectRow): boolean {
  return isActive(p) && !!p.dueDate && new Date(p.dueDate).getTime() < Date.now() - DAY;
}

/** Who currently holds the ball on a project. */
export function ballWith(p: ProjectRow): { name: string; role: string } {
  const o = S[p.stage]?.owner;
  if (o === "designer") return { name: p.designer || "Unassigned", role: "Designer" };
  if (o === "lead") return { name: p.lead || "Team Lead", role: "Team Lead" };
  if (o === "head") return { name: p.head || "Team Head", role: "Team Head" };
  if (o === "pm") return { name: p.pm || "Project Manager", role: "Project Mgr" };
  if (o === "amazon") return { name: "Amazon", role: "External" };
  return { name: "—", role: "Closed" };
}

/** One gate for every stage move. Head + PM always pass; everyone else may
 *  only act on their OWN gate for their OWN project. This is re-checked
 *  server-side in every Server Action — never trust the disabled attribute. */
export function canAct(user: SessionUser | null, p: ProjectRow, mv: Move): boolean {
  if (!user) return false;
  if (user.role === "visitor") return false;
  if (isFull(user)) return true;
  if (!mv.roles.includes(user.role)) return false;
  if (user.role === "designer") return p.designer === user.name;
  if (user.role === "lead") return p.lead === user.name;
  return false;
}
export function whyNot(user: SessionUser | null, p: ProjectRow, mv: Move): string {
  if (!user) return "Sign in first";
  if (mv.roles.length === 0) return "Only the Team Head or Project Manager can do this";
  if (!mv.roles.includes(user.role)) return "Only " + mv.roles.map(roleLb).join(" / ") + " · Team Head · Project Manager can do this";
  if (user.role === "designer") return "This is " + (p.designer || "another designer") + "'s project — you can only move your own";
  if (user.role === "lead") return p.lead + " is the Team Lead on this project, not you";
  return "Not permitted";
}
export function canEdit(user: SessionUser | null, p: ProjectRow): boolean {
  if (isReadonly(user)) return false;
  if (isFull(user)) return true;
  if (!user) return false;
  if (user.role === "lead") return p.lead === user.name;
  if (user.role === "designer") return p.designer === user.name;
  return false;
}

export function shortType(t: string): string {
  const map: Record<string, string> = {
    "Main Image": "HERO",
    "Main Gallery": "GAL",
    "A+ Content": "A+",
    "Premium Gallery": "PREM",
    "Brand Story": "STORY",
    "Infographic Set": "INFO",
    Video: "VID",
    "Variation Images": "VAR",
  };
  return map[t] || t.slice(0, 4).toUpperCase();
}

export function evVerb(e: EventRow): string {
  if (e.kind === "create") return "created the project";
  if (e.kind === "view") return "viewed this card";
  if (e.kind === "comment") return "asked in chat";
  if (e.kind === "block") return "flagged this as blocked";
  if (e.kind === "unblock") return "cleared the block";
  if (e.kind === "edit") return "updated the project details";
  if (e.kind === "stage") {
    const t = e.toStage ? S[e.toStage] : null;
    if (e.toStage === "lead_fix" || e.toStage === "head_fix") return "requested a revision";
    if (e.toStage === "amz_rej") return "logged an Amazon rejection";
    if (e.toStage === "done") return "marked it LIVE on Amazon";
    if (e.toStage === "head_rev" && e.fromStage === "lead_rev") return "approved it → Team Head";
    if (e.toStage === "live_req") return "approved it for live";
    return "moved it to " + (t ? t.label : e.toStage);
  }
  return "updated it";
}

export function linkMentions(t: string): string {
  // caller is responsible for escaping `t` first; this only wraps @mentions.
  return t.replace(/@([A-Za-zÀ-ÿ]+(?: [A-Za-zÀ-ÿ]+)?)/g, '<span class="mention">@$1</span>');
}
