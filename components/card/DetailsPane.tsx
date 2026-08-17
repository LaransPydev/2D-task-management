import { DAY, avg, daysBetween, fmtDate, isOverdue, STAGES, type EventRow, type ProjectRow } from "@/lib/domain";
import { stageDurations } from "@/lib/analytics";

function Fact({ k, v, cls = "" }: { k: string; v: React.ReactNode; cls?: string }) {
  return (
    <div className="fact">
      <span className="k">{k}</span>
      <span className={"v " + cls}>{v}</span>
    </div>
  );
}

export default function DetailsPane({ p, events }: { p: ProjectRow; events: EventRow[] }) {
  const created = p.createdAt;
  const doneEv = [...events].filter((e) => e.toStage === "done").pop();
  const cycle = doneEv ? ((new Date(doneEv.at).getTime() - new Date(created).getTime()) / DAY).toFixed(0) + " days" : daysBetween(created) + " days so far";
  const sd = stageDurations([p], events);
  const slow = STAGES.filter((s) => sd[s.id]?.length)
    .map((s) => ({ s, v: avg(sd[s.id]) }))
    .sort((a, b) => b.v - a.v)[0];

  return (
    <>
      <div className="facts">
        <Fact k="Product" v={p.product} />
        <Fact k="Deliverable" v={p.dtype} />
        <Fact k="Marketplace" v={"amazon." + p.market.toLowerCase()} />
        <Fact k="ASIN" v={p.asin || "—"} cls="mono" />
        <Fact k="Designer" v={p.designer || "—"} />
        <Fact k="Team Lead" v={p.lead || "—"} />
        <Fact k="Team Head" v={p.head || "—"} />
        <Fact k="Project Manager" v={p.pm || "—"} />
        <Fact k="Priority" v={p.priority} />
        <Fact
          k="Due"
          v={
            <>
              {fmtDate(p.dueDate)}
              {isOverdue(p) && <span style={{ color: "var(--ink)", fontWeight: 600 }}> · overdue</span>}
            </>
          }
          cls="mono"
        />
        <Fact k="Started" v={fmtDate(created)} cls="mono" />
        <Fact k="Cycle time" v={cycle} cls="mono" />
        <Fact k="Amazon ticket" v={p.ticketId || "—"} cls="mono" />
        <Fact k="Ticket type" v={p.ticketType || "—"} />
        <Fact k="Slowest stage here" v={slow ? `${slow.s.short} · ${slow.v.toFixed(1)}d` : "—"} cls="mono" />
      </div>
      <div className="revbars">
        Revisions — <b>Lead {p.revLead || 0}</b> · <b>Head {p.revHead || 0}</b> · <b>Amazon rejections {p.revAmz || 0}</b>
      </div>
    </>
  );
}
