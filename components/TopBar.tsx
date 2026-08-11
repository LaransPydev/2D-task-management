"use client";

import { useApp } from "./app-context";
import { avColor, ballWith, initials, isActive, roleLb } from "@/lib/domain";
import type { ViewName } from "./app-context";

function Avatar({ name }: { name: string }) {
  return (
    <i className="av" style={{ background: avColor(name) }} title={name}>
      {initials(name)}
    </i>
  );
}

export default function TopBar({ activeCount, attnCount, isValidating }: { activeCount: number; attnCount: number; isValidating: boolean }) {
  const { view, setView, user, isReadonly, projects, openModal } = useApp();
  const mine = projects.filter((p) => isActive(p) && ballWith(p).name === user.name).length;

  const tabs: { id: ViewName; label: string; count?: number }[] = [
    { id: "pipeline", label: "Pipeline", count: activeCount },
    { id: "board", label: "Board" },
    { id: "perf", label: "Performance" },
    { id: "attn", label: "Needs attention", count: attnCount },
  ];

  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark" />
        <div className="brand-txt">
          <b>Sportstech</b>
          <span>Creative Ops{isValidating ? " · syncing…" : ""}</span>
        </div>
      </div>
      <div className="tabs">
        {tabs.map((t) => (
          <button key={t.id} className={"tab" + (view === t.id ? " on" : "")} onClick={() => setView(t.id)}>
            {t.label} {t.count !== undefined && <span className="cnt">{t.count}</span>}
          </button>
        ))}
      </div>
      <div className="topbar-right">
        {!isReadonly && (
          <button className="btn pri sm" onClick={() => openModal({ kind: "new" })}>
            + New project
          </button>
        )}
        <button className="who" onClick={() => openModal({ kind: "who" })}>
          <Avatar name={user.name} />
          <span className="who-t">
            <b>{user.name}</b>
            <span>
              {roleLb(user.role)}
              {isReadonly ? " · read-only" : mine ? ` · ${mine} on you` : ""}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
