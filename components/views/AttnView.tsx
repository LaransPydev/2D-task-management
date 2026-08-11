"use client";

import { useApp } from "../app-context";
import { INK, WIP_LIMIT, AGE_CRIT } from "@/lib/domain";
import { attnList, designerStats } from "@/lib/analytics";
import { monthKey } from "@/lib/domain";

export default function AttnView() {
  const { projects, events, gotoProject } = useApp();
  const A = attnList(projects);
  const red = A.filter((a) => a.sev === INK).length;
  const wip = designerStats(projects, events, monthKey(new Date())).filter((d) => d.act > WIP_LIMIT);

  return (
    <>
      <div className="sechead">
        <h2>Needs attention</h2>
        <div className="rule" />
        <span className="n">
          {red} urgent · {A.length - red} watch · ranked by cost of ignoring it
        </span>
      </div>
      {wip.length > 0 && (
        <div className="callout warn">
          <div>
            <b>Over WIP limit.</b> {wip.map((d) => `${d.n} has ${d.act} active projects`).join("; ")}. Above {WIP_LIMIT} in parallel, everything slows down
            at once instead of one thing finishing. <b>Recommendation:</b> freeze new assignments for them until something reaches Amazon review.
          </div>
        </div>
      )}
      {A.length ? (
        <div className="alerts">
          {A.map((a, i) => (
            <button className="alert" key={a.p.id + i} onClick={() => gotoProject(a.p.id)}>
              <span className="sev" style={{ background: a.sev }} />
              <span className="bd2">
                <b>
                  {a.p.product} · {a.p.dtype} <span style={{ color: a.sev, fontWeight: 600 }}>— {a.t}</span>
                </b>
                <span>{a.w}</span>
              </span>
              <span className="rt">{a.r}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty">
          <h3>Nothing is stuck</h3>
          <p>No blocks, nothing older than {AGE_CRIT} days in a stage, nothing overdue. That is the state you want the board in at the end of every week.</p>
        </div>
      )}
    </>
  );
}
