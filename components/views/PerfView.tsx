"use client";

import { useApp } from "../app-context";
import { AGE_WARN, INK, WIP_LIMIT, STAGES, avg, monthKey, monthLabel } from "@/lib/domain";
import { designerStats, monthMetrics, monthsAvailable, rejectionBreakdown, stageDurations } from "@/lib/analytics";
import { filterProjects } from "@/lib/filter";
import { exportCSV } from "@/lib/csv";
import Kpi from "../Kpi";

export default function PerfView() {
  const { projects, events, amonth, setAmonth, filters, user, toast } = useApp();
  const months = monthsAvailable(projects, events);
  const mk = amonth || monthKey(new Date());
  const idx = months.indexOf(mk);
  const m = monthMetrics(projects, events, mk);
  const prev = idx > 0 ? monthMetrics(projects, events, months[idx - 1]) : null;

  const sd = stageDurations(projects, events);
  const rows = STAGES.filter((s) => s.id !== "done" && sd[s.id]?.length)
    .map((s) => ({ s, v: avg(sd[s.id]), n: sd[s.id].length }))
    .sort((a, b) => b.v - a.v);
  const maxV = Math.max(...rows.map((r) => r.v), 1);

  const ds = designerStats(projects, events, mk);
  const rej = rejectionBreakdown(events);
  const maxRej = Math.max(...rej.map((r) => r[1]), 1);

  const last6 = months.slice(-6);
  const mms = last6.map((k) => monthMetrics(projects, events, k));
  const maxStack = Math.max(...mms.map((x) => x.designs + x.live + x.leadRev + x.headRev + x.rejects), 1);

  const funnel: [string, number, string][] = [
    ["Projects started", m.started, "#C7DFF8"],
    ["Designs submitted", m.designs, "#93C2F1"],
    ["Lead approved", m.leadPass, "#5FA5EA"],
    ["Head approved", m.headPass, "#2B88E5"],
    ["Live on Amazon", m.live, "#0071E3"],
  ];
  const maxF = Math.max(...funnel.map((f) => f[1]), 1);

  function delta(a: number, b: number | null | undefined) {
    if (b == null) return "";
    const label = "vs " + monthLabel(months[idx - 1]);
    if (a - b > 0) return `▲ ${a - b} ${label}`;
    if (a - b < 0) return `▼ ${b - a} ${label}`;
    return `level ${label}`;
  }

  function onExport() {
    const rows = filterProjects(projects, filters, user, events);
    const n = exportCSV(rows);
    toast("Exported", `${n} projects — semicolon separated, opens straight in German Excel.`, "ok");
  }

  return (
    <>
      <div className="filters">
        <div className="fld">
          <label>Month</label>
          <select value={mk} onChange={(e) => setAmonth(e.target.value)}>
            {months
              .slice()
              .reverse()
              .map((x) => (
                <option key={x} value={x}>
                  {monthLabel(x)}
                </option>
              ))}
          </select>
        </div>
        <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--tx-3)" }}>
          Monthly figures count <b style={{ color: "var(--tx-2)" }}>events that happened in the month</b>, not projects created in it — so a project started in
          June and shipped in August counts as August output.
        </span>
        <div className="spacer" />
        <button className="btn sm gh" onClick={onExport}>
          Export CSV
        </button>
      </div>

      <div className="kpis">
        <Kpi lb="Went live" vl={m.live} c="--ok" sb={delta(m.live, prev?.live)} />
        <Kpi lb="Designs submitted" vl={m.designs} c="--info" sb={delta(m.designs, prev?.designs)} />
        <Kpi lb="Projects started" vl={m.started} c="--acc" sb={delta(m.started, prev?.started)} />
        <Kpi lb="First-pass approval" vl={m.firstPass} unit="%" c={m.firstPass >= 60 ? "--ok" : "--warn"} sb={`${m.leadRev} lead + ${m.headRev} head revisions`} />
        <Kpi lb="Amazon approval" vl={m.live + m.rejects ? m.amzApproval : "—"} unit={m.live + m.rejects ? "%" : undefined} c={m.rejects ? "--bad" : "--ok"} sb={`${m.rejects} rejected`} />
        <Kpi lb="Avg cycle time" vl={m.cycle ? m.cycle.toFixed(1) : "—"} unit={m.cycle ? "d" : undefined} c="--warn" sb="selected → live" />
      </div>

      <div className="grid2">
        <div className="panel">
          <div className="panel-h">
            <h3>Where time actually goes</h3>
            <span className="hint">
              avg days per stage · all projects
              <br />
              vertical mark = {AGE_WARN}d target
            </span>
          </div>
          <div className="panel-b">
            <div className="hbars">
              {rows.map((r) => (
                <div className="hbar" key={r.s.id}>
                  <span className="nm">
                    {r.s.n}. {r.s.short}
                  </span>
                  <span className="tr">
                    <span className="fl" style={{ "--c": r.s.c, width: `${Math.max(2, (r.v / maxV) * 100)}%` } as React.CSSProperties} />
                    <span className="thresh" style={{ left: `${Math.min(99, (AGE_WARN / maxV) * 100)}%` }} />
                  </span>
                  <span className="vv">
                    {r.v.toFixed(1)}d <s>×{r.n}</s>
                  </span>
                </div>
              ))}
            </div>
            <p className="hintline" style={{ margin: "12px 0 0" }}>
              {rows.length ? (
                <>
                  <b style={{ color: "var(--tx-2)" }}>
                    Biggest drag: {rows[0].s.label} at {rows[0].v.toFixed(1)} days.
                  </b>{" "}
                  Anything past the {AGE_WARN}-day mark is queue time, not work time — that is where a nudge buys you days for free.
                </>
              ) : (
                "Not enough history yet."
              )}
            </p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-h">
            <h3>Monthly output</h3>
            <span className="hint">last {last6.length} months</span>
          </div>
          <div className="panel-b">
            <div className="months">
              {mms.map((x, i) => {
                const segs: [string, number][] = [
                  ["#0071E3", x.live],
                  ["#79B3EE", x.designs],
                  ["#8E9294", x.leadRev],
                  ["#C6CACC", x.headRev],
                  [INK, x.rejects],
                ];
                return (
                  <div
                    className="mcol"
                    key={last6[i]}
                    title={`${monthLabel(last6[i])}: ${x.live} live, ${x.designs} designs, ${x.leadRev + x.headRev} revisions, ${x.rejects} rejected`}
                  >
                    <div className="stk">
                      {segs.map(([c, v], j) => (v ? <i className="seg" style={{ background: c, height: `${(v / maxStack) * 112}px` }} key={j} /> : null))}
                    </div>
                    <span className="lb2">{monthLabel(last6[i]).split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
            <div className="legend">
              <span>
                <i style={{ background: "#0071E3" }} />
                Live
              </span>
              <span>
                <i style={{ background: "#79B3EE" }} />
                Designs
              </span>
              <span>
                <i style={{ background: "#8E9294" }} />
                Lead rev.
              </span>
              <span>
                <i style={{ background: "#C6CACC" }} />
                Head rev.
              </span>
              <span>
                <i style={{ background: "#25282A" }} />
                Rejected
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid2">
        <div className="panel">
          <div className="panel-h">
            <h3>{monthLabel(mk)} · flow through the gates</h3>
            <span className="hint">events counted in this month</span>
          </div>
          <div className="panel-b">
            <div className="funnel">
              {funnel.map(([nm, v, c]) => (
                <div className="fstep" key={nm}>
                  <span className="nm">{nm}</span>
                  <span className="tr2">
                    <span className="fl2" style={{ "--c": c, width: `${Math.max(3, (v / maxF) * 100)}%` } as React.CSSProperties} />
                  </span>
                  <span className="vv2">{v}</span>
                </div>
              ))}
            </div>
            <p className="hintline" style={{ margin: "12px 0 0" }}>
              {m.designs || m.live ? (
                <>
                  <b style={{ color: "var(--tx-2)" }}>
                    {m.live} went live, {m.designs} newly submitted.
                  </b>{" "}
                  These are flow counts, not a cohort — live counts finishes, submitted counts starts, so the bars only line up when the pipeline is in steady
                  state.{" "}
                  {m.live > m.designs
                    ? "More finished than started: you are draining a backlog from earlier months, which will not repeat."
                    : m.live < m.designs
                      ? "More started than finished: work is accumulating in the middle of the pipeline — check the stage-time chart on the left."
                      : "Balanced month."}
                </>
              ) : (
                "Nothing moved this month."
              )}
            </p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-h">
            <h3>Amazon rejection reasons</h3>
            <span className="hint">all time · fix the top one first</span>
          </div>
          <div className="panel-b">
            {rej.length ? (
              <>
                <div className="hbars">
                  {rej.map(([r, v]) => (
                    <div className="hbar" key={r}>
                      <span className="nm" title={r}>
                        {r}
                      </span>
                      <span className="tr">
                        <span className="fl" style={{ "--c": INK, width: `${(v / maxRej) * 100}%` } as React.CSSProperties} />
                      </span>
                      <span className="vv">{v}</span>
                    </div>
                  ))}
                </div>
                <p className="hintline" style={{ margin: "12px 0 0" }}>
                  <b style={{ color: "var(--tx-2)" }}>Each rejection costs you a full loop back through design and both approval gates.</b> A recurring reason
                  is a briefing problem, not an Amazon problem — put the top reason into the design checklist.
                </p>
              </>
            ) : (
              <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tx-3)" }}>No rejections logged. Nothing to fix.</p>
            )}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-h">
          <h3>Designer performance · {monthLabel(mk)}</h3>
          <span className="hint">WIP limit {WIP_LIMIT} · first-pass = submitted without a lead revision</span>
        </div>
        <div className="panel-b" style={{ overflowX: "auto" }}>
          <table className="dtable">
            <thead>
              <tr>
                <th>Designer</th>
                <th>Active</th>
                <th>WIP</th>
                <th>Submitted</th>
                <th>Live</th>
                <th>Lead rev.</th>
                <th>Head rev.</th>
                <th>Rejected</th>
                <th>First pass</th>
                <th>Avg days designing</th>
              </tr>
            </thead>
            <tbody>
              {ds.map((d) => (
                <tr key={d.n}>
                  <td>{d.n}</td>
                  <td>
                    {d.act}
                    {d.blocked ? <span className="pill r"> {d.blocked} blk</span> : ""}
                  </td>
                  <td>
                    <span className="wip">
                      {d.act ? (
                        Array.from({ length: Math.min(d.act, 8) }).map((_, i) => <i key={i} className={i >= WIP_LIMIT ? "over" : ""} />)
                      ) : (
                        <s style={{ color: "var(--tx-3)" }}>—</s>
                      )}
                    </span>
                  </td>
                  <td>{d.subs}</td>
                  <td>{d.live}</td>
                  <td>{d.lrev}</td>
                  <td>{d.hrev}</td>
                  <td>{d.rej}</td>
                  <td>
                    <span className={"pill " + (d.firstPass >= 70 ? "g" : d.firstPass >= 45 ? "y" : "r")}>{d.subs ? d.firstPass + "%" : "—"}</span>
                  </td>
                  <td>{d.designDays ? d.designDays.toFixed(1) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="hintline" style={{ margin: "14px 0 0" }}>
            Read <b style={{ color: "var(--tx-2)" }}>first pass</b> before speed. A designer shipping fast with a 30% first-pass rate is burning the Team
            Lead&apos;s time, and every loop adds days to cycle time. If first pass is low across everyone, the brief is the problem — not the designers.
          </p>
        </div>
      </div>
    </>
  );
}
