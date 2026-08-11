import { fmtStamp, ago, roleLb, evVerb, S, type EventRow } from "@/lib/domain";

export default function LogPane({ events }: { events: EventRow[] }) {
  if (!events.length) {
    return <p style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--tx-3)" }}>Nothing logged yet.</p>;
  }
  const rows = [...events].reverse();
  return (
    <div className="tl">
      {rows.map((e) => {
        const to = e.toStage ? S[e.toStage] : null;
        const fr = e.fromStage ? S[e.fromStage] : null;
        const col = to ? to.c : "var(--tx-3)";
        const nc = e.toStage === "lead_fix" || e.toStage === "head_fix" ? "rev" : e.toStage === "amz_rej" ? "rej" : "";
        return (
          <div className="ev" style={{ "--ec": col } as React.CSSProperties} key={e.id}>
            <div className="eh">
              <b>{e.actor}</b>
              <span className="ts">
                {roleLb(e.actorRole)} · {fmtStamp(e.at)} · {ago(e.at)}
              </span>
            </div>
            {e.kind === "stage" ? (
              <div className="flow">
                <s>{fr ? fr.label : "—"}</s> <em>▶</em> <span style={{ color: col }}>{to ? to.label : ""}</span>
              </div>
            ) : (
              <div className="flow">
                <s>{evVerb(e)}</s>
              </div>
            )}
            {e.note && <div className={"note " + nc}>{e.note}</div>}
          </div>
        );
      })}
    </div>
  );
}
