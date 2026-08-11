"use client";

import { useApp } from "../app-context";
import { filterProjects } from "@/lib/filter";
import { monthMetrics, stageDurations } from "@/lib/analytics";
import { AGE_CRIT, avg, daysBetween, isActive, monthKey, STAGES } from "@/lib/domain";
import FilterBar from "../FilterBar";
import Kpi from "../Kpi";
import ProjectCard from "../card/ProjectCard";

export default function PipelineView() {
  const { projects, events, filters, user, openModal } = useApp();
  const list = filterProjects(projects, filters, user);
  const active = projects.filter(isActive);
  const stale = active.filter((p) => daysBetween(p.stageSince) >= AGE_CRIT).length;
  const m = monthMetrics(projects, events, monthKey(new Date()));
  const sd = stageDurations(projects, events);
  const worst = STAGES.filter((s) => s.id !== "done" && sd[s.id]?.length)
    .map((s) => ({ s, v: avg(sd[s.id]) }))
    .sort((a, b) => b.v - a.v)[0];

  return (
    <>
      <FilterBar />
      <div className="kpis">
        <Kpi lb="Live this month" vl={m.live} c="--ok" sb={`${m.started} new projects started`} />
        <Kpi lb="Designs submitted" vl={m.designs} c="--info" sb={`${m.submits} total handoffs to review`} />
        <Kpi lb="First-pass approval" vl={m.firstPass} unit="%" c={m.firstPass >= 60 ? "--ok" : "--warn"} sb={`${m.leadRev} lead revisions requested`} />
        <Kpi
          lb="Amazon approval"
          vl={m.live + m.rejects ? m.amzApproval : "—"}
          unit={m.live + m.rejects ? "%" : undefined}
          c={m.rejects ? "--bad" : "--ok"}
          sb={`${m.rejects} rejection${m.rejects === 1 ? "" : "s"} this month`}
        />
        <Kpi lb="Avg cycle time" vl={m.cycle ? m.cycle.toFixed(0) : "—"} unit={m.cycle ? "d" : undefined} c="--acc" sb="selected → live" />
        <Kpi lb="Blocked" vl={projects.filter((p) => p.blocked).length} c="--bad" sb={`${stale} stale ${AGE_CRIT}d+`} />
        <Kpi lb="Slowest stage" vl={worst ? worst.v.toFixed(1) : "—"} unit={worst ? "d" : undefined} c="--warn" sb={worst ? worst.s.short : "no data"} />
      </div>
      <div className="sechead">
        <h2>Projects</h2>
        <div className="rule" />
        <span className="n">
          {list.length} shown · {active.length} active · {projects.length} total
        </span>
      </div>
      {list.length ? (
        <div className="cards">
          {list.map((p) => (
            <ProjectCard p={p} key={p.id} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <h3>Nothing matches those filters</h3>
          <p>Clear the filters, or start a project — every project is one product plus one deliverable type, e.g. “WP300 Walking Pad · Main Gallery · DE”.</p>
          <button className="btn pri" onClick={() => openModal({ kind: "new" })}>
            + New project
          </button>
        </div>
      )}
    </>
  );
}
