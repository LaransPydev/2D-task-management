import { ballWith, daysBetween, S, type ProjectRow } from "./domain";

export function exportCSV(rows: ProjectRow[]): number {
  const head = [
    "Product",
    "Deliverable",
    "Market",
    "ASIN",
    "Stage",
    "Ball with",
    "Days in stage",
    "Designer",
    "Lead",
    "Head",
    "PM",
    "Priority",
    "Due",
    "Overdue",
    "Blocked",
    "Block reason",
    "Lead revisions",
    "Head revisions",
    "Amazon rejections",
    "Ticket",
    "Started",
  ];
  const body = rows.map((p) => {
    const b = ballWith(p);
    const overdue = p.stage !== "done" && !!p.dueDate && new Date(p.dueDate).getTime() < Date.now() - 86400000;
    return [
      p.product,
      p.dtype,
      p.market,
      p.asin,
      S[p.stage].label,
      b.name,
      daysBetween(p.stageSince),
      p.designer,
      p.lead,
      p.head,
      p.pm,
      p.priority,
      (p.dueDate || "").slice(0, 10),
      overdue ? "YES" : "",
      p.blocked ? "YES" : "",
      p.blockReason,
      p.revLead || 0,
      p.revHead || 0,
      p.revAmz || 0,
      p.ticketId,
      (p.createdAt || "").slice(0, 10),
    ];
  });
  const csv = [head, ...body].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "sportstech-creative-ops-" + new Date().toISOString().slice(0, 10) + ".csv";
  a.click();
  URL.revokeObjectURL(a.href);
  return body.length;
}
