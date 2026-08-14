"use client";

import { useApp } from "./app-context";
import { DTYPES, MARKETS, STAGES, AGE_CRIT, monthLabel } from "@/lib/domain";
import { monthsAvailable } from "@/lib/analytics";
import { filterProjects } from "@/lib/filter";

function FlagButton({ k, label, alarm }: { k: string; label: string; alarm?: boolean }) {
  const { filters, setFilter } = useApp();
  const on = filters.flag === k;
  return (
    <button className={on ? "on" + (alarm ? " alarm" : "") : ""} onClick={() => setFilter("flag", k)}>
      {label}
    </button>
  );
}

export default function FilterBar() {
  const { projects, events, filters, setFilter, user, isFull, open, setManyOpen, openModal, dbDtypes, dbMarkets } = useApp();
  const designers = [...new Set(projects.map((p) => p.designer))].filter((x): x is string => !!x).sort();
  const months = monthsAvailable(projects, events);
  const list = filterProjects(projects, filters, user, events);
  const dtypes = dbDtypes.length > 0 ? dbDtypes : DTYPES;
  const markets = dbMarkets.length > 0 ? dbMarkets : MARKETS;

  return (
    <div className="filters">
      <input type="search" placeholder="Search product, concept, link…" value={filters.q} onChange={(e) => setFilter("q", e.target.value)} />
      <div className="fld">
        <label>Designer</label>
        <select value={filters.designer} onChange={(e) => setFilter("designer", e.target.value)}>
          <option value="">All</option>
          {designers.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="fld">
        <label>Deliverable</label>
        <select value={filters.dtype} onChange={(e) => setFilter("dtype", e.target.value)}>
          <option value="">All</option>
          {dtypes.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="fld">
        <label>Market</label>
        <select value={filters.market} onChange={(e) => setFilter("market", e.target.value)}>
          <option value="">All</option>
          {markets.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div className="fld">
        <label>Stage</label>
        <select value={filters.stage} onChange={(e) => setFilter("stage", e.target.value)}>
          <option value="">All</option>
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.n}. {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="fld">
        <label>Started</label>
        <select value={filters.month} onChange={(e) => setFilter("month", e.target.value)}>
          <option value="">Any month</option>
          {months
            .slice()
            .reverse()
            .map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
        </select>
      </div>
      <div className="chipset">
        <FlagButton k="" label="All" />
        <FlagButton k="active" label="Active" />
        <FlagButton k="ball" label="On me" />
        <FlagButton k="mine" label="My projects" />
        <FlagButton k="blocked" label="Blocked" alarm />
        <FlagButton k="overdue" label="Overdue" alarm />
        <FlagButton k="stale" label={`Stale ${AGE_CRIT}d+`} alarm />
      </div>
      <div className="spacer" />
      <button
        className="btn sm gh"
        onClick={() => {
          const allOpen = list.every((p) => open.has(p.id));
          setManyOpen(list.map((p) => p.id), !allOpen);
        }}
      >
        Expand all logs
      </button>
      {isFull && (
        <button className="btn sm gh" title="Delete every project" onClick={() => openModal({ kind: "wipe" })}>
          Clear all
        </button>
      )}
    </div>
  );
}
