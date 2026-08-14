"use client";

import { useApp } from "../app-context";
import { filterProjects } from "@/lib/filter";
import { AGE_CRIT, AGE_WARN, STAGES, avColor, ballWith, daysBetween, initials } from "@/lib/domain";
import FilterBar from "../FilterBar";

export default function BoardView() {
  const { projects, events, filters, user, gotoProject } = useApp();
  const list = filterProjects(projects, filters, user, events);

  return (
    <>
      <FilterBar />
      <div className="sechead">
        <h2>Pipeline board</h2>
        <div className="rule" />
        <span className="n">click a card to open it in the pipeline view</span>
      </div>
      <div className="stage-flow" aria-label="Pipeline stages">
        {STAGES.map((stage, index) => (
          <div className="stage-flow-item" key={stage.id}>
            <span>{stage.n}.{stage.short}</span>
            {index < STAGES.length - 1 && <span className="stage-flow-arrow" aria-hidden="true">→</span>}
          </div>
        ))}
      </div>
      <div className="board">
        {STAGES.map((s) => {
          const col = list.filter((p) => p.stage === s.id);
          if (col.length === 0) return null;
          return (
            <div className="col" key={s.id}>
              <div className="col-h">
                <i className="sq" style={{ background: s.c }} />
                <b>
                  {s.n}. {s.short}
                </b>
                <span className="c">{col.length}</span>
              </div>
              <div className="col-b">
                {col.map((p) => {
                    const b = ballWith(p);
                    const d = daysBetween(p.stageSince);
                    return (
                      <button className={"mini" + (p.blocked ? " blk" : "")} key={p.id} onClick={() => gotoProject(p.id)}>
                        <b>{p.product}</b>
                        <span className="t">
                          {p.dtype} · {p.market}
                        </span>
                        <span className="f">
                          <span className="who2">
                            <i className="av" style={{ background: avColor(b.name) }} title={b.name}>
                              {initials(b.name)}
                            </i>{" "}
                            {b.name.split(" ")[0]}
                          </span>
                          <span className={"age " + (d >= AGE_CRIT ? "crit" : d >= AGE_WARN ? "hot" : "")}>{d}d</span>
                        </span>
                      </button>
                    );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
