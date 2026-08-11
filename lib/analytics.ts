/**
 * Pure analytics over the project/event set. Ported from the original app's
 * "DERIVED" and "RENDER: performance" sections — same math, just taking
 * explicit arrays instead of reading a global `state` object.
 */
import {
  AGE_CRIT,
  AGE_WARN,
  DAY,
  EventRow,
  GREY,
  INK,
  ProjectRow,
  REJECT_REASONS,
  S,
  WIP_LIMIT,
  avg,
  ballWith,
  daysBetween,
  isActive,
  isOverdue,
  monthKey,
  pct,
  STAGES,
} from "./domain";

export function evOf(events: EventRow[], pid: string): EventRow[] {
  return events.filter((e) => e.projectId === pid).sort((a, b) => a.at.localeCompare(b.at));
}
export function cmOf<T extends { projectId: string; at: string }>(comments: T[], pid: string): T[] {
  return comments.filter((c) => c.projectId === pid).sort((a, b) => a.at.localeCompare(b.at));
}
export function lastEv(events: EventRow[], pid: string): EventRow | null {
  const e = evOf(events, pid);
  return e[e.length - 1] || null;
}

export function stageDurations(projects: ProjectRow[], allEvents: EventRow[]): Record<string, number[]> {
  const ids = new Set(projects.map((p) => p.id));
  const byP: Record<string, EventRow[]> = {};
  allEvents.forEach((e) => {
    if (ids.has(e.projectId)) (byP[e.projectId] = byP[e.projectId] || []).push(e);
  });
  const out: Record<string, number[]> = {};
  STAGES.forEach((s) => (out[s.id] = []));
  Object.entries(byP).forEach(([pid, evs]) => {
    evs.sort((a, b) => a.at.localeCompare(b.at));
    for (let i = 0; i < evs.length - 1; i++) {
      const st = evs[i].toStage;
      if (!st || !out[st]) continue;
      out[st].push((new Date(evs[i + 1].at).getTime() - new Date(evs[i].at).getTime()) / DAY);
    }
    const last = evs[evs.length - 1];
    const p = projects.find((x) => x.id === pid);
    if (p && last && last.toStage && p.stage !== "done" && out[last.toStage]) {
      out[last.toStage].push((Date.now() - new Date(last.at).getTime()) / DAY);
    }
  });
  return out;
}

export interface MonthMetrics {
  mk: string;
  live: number;
  submits: number;
  designs: number;
  leadRev: number;
  headRev: number;
  rejects: number;
  leadPass: number;
  headPass: number;
  started: number;
  cycle: number;
  firstPass: number;
  amzApproval: number;
}
export function monthMetrics(projects: ProjectRow[], events: EventRow[], mk: string): MonthMetrics {
  const inM = (e: EventRow) => monthKey(e.at) === mk;
  const st = events.filter((e) => e.kind === "stage");
  const live = st.filter((e) => e.toStage === "done" && inM(e));
  const submits = st.filter((e) => e.toStage === "lead_rev" && inM(e));
  const designs = st.filter((e) => e.toStage === "lead_rev" && e.fromStage === "design" && inM(e));
  const leadRev = st.filter((e) => e.toStage === "lead_fix" && inM(e));
  const headRev = st.filter((e) => e.toStage === "head_fix" && inM(e));
  const rejects = st.filter((e) => e.toStage === "amz_rej" && inM(e));
  const leadPass = st.filter((e) => e.fromStage === "lead_rev" && e.toStage === "head_rev" && inM(e));
  const headPass = st.filter((e) => e.fromStage === "head_rev" && e.toStage === "live_req" && inM(e));
  const started = projects.filter((p) => monthKey(p.createdAt) === mk);
  const cycles = live
    .map((e) => {
      const p = projects.find((x) => x.id === e.projectId);
      return p ? (new Date(e.at).getTime() - new Date(p.createdAt).getTime()) / DAY : null;
    })
    .filter((x): x is number => x != null);
  return {
    mk,
    live: live.length,
    submits: submits.length,
    designs: designs.length,
    leadRev: leadRev.length,
    headRev: headRev.length,
    rejects: rejects.length,
    leadPass: leadPass.length,
    headPass: headPass.length,
    started: started.length,
    cycle: avg(cycles),
    firstPass: pct(leadPass.length, leadPass.length + leadRev.length),
    amzApproval: pct(live.length, live.length + rejects.length),
  };
}
export function monthsAvailable(projects: ProjectRow[], events: EventRow[]): string[] {
  const ks = new Set(projects.map((p) => monthKey(p.createdAt)));
  events.forEach((e) => ks.add(monthKey(e.at)));
  return [...ks].sort();
}

export interface DesignerStat {
  n: string;
  act: number;
  subs: number;
  live: number;
  lrev: number;
  hrev: number;
  rej: number;
  firstPass: number;
  designDays: number;
  blocked: number;
}
export function designerStats(projects: ProjectRow[], events: EventRow[], mk: string): DesignerStat[] {
  const names = [...new Set(projects.map((p) => p.designer))].filter((x): x is string => !!x).sort();
  const pOf = (id: string) => projects.find((x) => x.id === id);
  return names.map((n) => {
    const own = projects.filter((p) => p.designer === n);
    const act = own.filter(isActive);
    const ev = events.filter((e) => e.kind === "stage" && monthKey(e.at) === mk && pOf(e.projectId)?.designer === n);
    const subs = ev.filter((e) => e.toStage === "lead_rev").length;
    const live = ev.filter((e) => e.toStage === "done").length;
    const lrev = ev.filter((e) => e.toStage === "lead_fix").length;
    const hrev = ev.filter((e) => e.toStage === "head_fix").length;
    const rej = ev.filter((e) => e.toStage === "amz_rej").length;
    const dd = stageDurations(own, events);
    return {
      n,
      act: act.length,
      subs,
      live,
      lrev,
      hrev,
      rej,
      firstPass: pct(subs - lrev, Math.max(subs, 1)),
      designDays: avg([...(dd.design || []), ...(dd.lead_fix || []), ...(dd.head_fix || [])]),
      blocked: act.filter((p) => p.blocked).length,
    };
  });
}

export function rejectionBreakdown(events: EventRow[]): [string, number][] {
  const out: Record<string, number> = {};
  REJECT_REASONS.forEach((r) => (out[r] = 0));
  events
    .filter((e) => e.toStage === "amz_rej")
    .forEach((e) => {
      const n = String(e.note || "");
      const hit = REJECT_REASONS.find((r) => n.toLowerCase().includes(r.toLowerCase().split(" /")[0].toLowerCase()));
      out[hit || "No reason given"]++;
    });
  return Object.entries(out)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
}

export interface Attn {
  sev: string;
  p: ProjectRow;
  t: string;
  w: string;
  r: string;
  o: number;
}
export function attnList(projects: ProjectRow[]): Attn[] {
  const A: Attn[] = [];
  projects.filter(isActive).forEach((p) => {
    const d = daysBetween(p.stageSince);
    const b = ballWith(p);
    if (p.blocked) A.push({ sev: INK, p, t: "Blocked", w: p.blockReason || "No reason given", r: `${d}d · ${b.name}`, o: 0 });
    else if (d >= AGE_CRIT) A.push({ sev: INK, p, t: `Stuck ${d} days in ${S[p.stage].short}`, w: `Waiting on ${b.name} (${b.role})`, r: `${d}d`, o: 1 });
    else if (isOverdue(p)) A.push({ sev: GREY, p, t: "Past its due date", w: `Due ${p.dueDate ?? ""} · now at ${S[p.stage].short}`, r: `${daysBetween(p.dueDate!)}d late`, o: 2 });
    else if (d >= AGE_WARN) A.push({ sev: GREY, p, t: `${d} days in ${S[p.stage].short}`, w: `Waiting on ${b.name} (${b.role})`, r: `${d}d`, o: 3 });
    if ((p.revLead || 0) + (p.revHead || 0) >= 3) A.push({ sev: GREY, p, t: `${(p.revLead || 0) + (p.revHead || 0)} revision loops`, w: "Repeated loops usually mean the brief was unclear, not the design", r: "↺", o: 4 });
    if ((p.revAmz || 0) >= 1 && p.stage !== "done") A.push({ sev: INK, p, t: `Amazon rejected ${p.revAmz}×`, w: "Check the rejection reason before resubmitting", r: "✕", o: 1 });
  });
  A.sort((a, b) => a.o - b.o);
  return A;
}
export function attnRed(projects: ProjectRow[]): number {
  return attnList(projects).filter((a) => a.sev === INK).length;
}

export { WIP_LIMIT };
