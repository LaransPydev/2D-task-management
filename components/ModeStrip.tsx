"use client";

import { useApp } from "./app-context";

export default function ModeStrip() {
  const { connError, lastSync, projects, isReadonly, refresh, openModal } = useApp();

  if (connError) {
    return (
      <div className="modestrip err">
        <i className="dot" style={{ background: "var(--bad)" }} />
        <b>Connection error</b>
        <span className="sep">│</span>
        {connError}
        <span className="sep">│</span>
        <button className="btn sm bad" onClick={() => refresh()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="modestrip live">
        <i className="dot pulse" style={{ background: "var(--ok)" }} />
        <b>Live · shared</b>
        <span className="sep">│</span>
        All {projects.length} projects synced from the database, refreshing every 6s
        <span className="sep">│</span>
        <span style={{ color: "var(--tx-3)" }}>
          last check {lastSync ? new Date(lastSync).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"}
        </span>
      </div>
      {isReadonly && (
        <div className="modestrip">
          <i className="dot" style={{ background: "var(--tx-3)" }} />
          <b>Read-only</b>
          <span className="sep">│</span>
          You are in as a Visitor — open any project, log, chat or chart, but nothing here can be changed.
          <span className="sep">│</span>
          <button className="btn sm gh" onClick={() => openModal({ kind: "who" })}>
            Sign in as yourself →
          </button>
        </div>
      )}
    </>
  );
}
