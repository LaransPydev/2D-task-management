import { AGE_CRIT, ProjectRow, ballWith, daysBetween, isActive, isOverdue, monthKey, type EventRow, type SessionUser } from "./domain";
import type { Filters } from "@/components/app-context";

export function filterProjects(projects: ProjectRow[], f: Filters, user: SessionUser, events: EventRow[] = []): ProjectRow[] {
  const queryTerms = f.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const notesByProject = new Map<string, string[]>();
  for (const event of events) {
    if (!event.note) continue;
    const notes = notesByProject.get(event.projectId) ?? [];
    notes.push(event.note);
    notesByProject.set(event.projectId, notes);
  }

  return projects
    .filter((p) => {
      if (queryTerms.length) {
        const searchableText = [
          p.product, p.asin, p.dtype, p.market, p.stage, p.priority,
          p.designer, p.lead, p.head, p.pm,
          p.ticketId, p.ticketType, p.ticketUrl, p.briefUrl, p.workUrl,
          p.blockReason, ...(notesByProject.get(p.id) ?? []),
        ].filter(Boolean).join(" ").toLowerCase();
        if (!queryTerms.every((term) => searchableText.includes(term))) return false;
      }
      if (f.designer && p.designer !== f.designer) return false;
      if (f.dtype && p.dtype !== f.dtype) return false;
      if (f.market && p.market !== f.market) return false;
      if (f.stage && p.stage !== f.stage) return false;
      if (f.month && monthKey(p.createdAt) !== f.month) return false;
      if (f.flag === "blocked" && !p.blocked) return false;
      if (f.flag === "overdue" && !isOverdue(p)) return false;
      if (f.flag === "stale" && !(isActive(p) && daysBetween(p.stageSince) >= AGE_CRIT)) return false;
      if (f.flag === "mine" && !(p.designer === user.name || p.lead === user.name || p.head === user.name || p.pm === user.name)) return false;
      if (f.flag === "ball" && ballWith(p).name !== user.name) return false;
      if (f.flag === "active" && !isActive(p)) return false;
      return true;
    })
    .sort((a, b) => {
      const sc = (x: ProjectRow) => (x.blocked ? 0 : 1) * 100 + (isOverdue(x) ? 0 : 1) * 10 + (isActive(x) ? 0 : 1);
      return sc(a) - sc(b) || daysBetween(b.stageSince) - daysBetween(a.stageSince);
    });
}
