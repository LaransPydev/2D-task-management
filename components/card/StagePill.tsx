import { INK, type Stage } from "@/lib/domain";

/* Three treatments, no third colour:
   solid accent = finished (Live)  ·  solid ink = a backwards loop (revision / rejection)
   tinted + ink text = in flight. Ink text everywhere keeps the label readable, which a
   pale-blue-on-pale-blue pill does not. */
export default function StagePill({ st }: { st: Stage }) {
  if (st.id === "done") {
    return (
      <span className="stg" style={{ background: "var(--acc)", color: "#fff", borderColor: "var(--acc)" }}>
        <i className="sq" style={{ background: "#fff" }} />
        {st.short}
      </span>
    );
  }
  if (st.c === INK) {
    return (
      <span className="stg" style={{ background: INK, color: "#fff", borderColor: INK }}>
        <i className="sq" style={{ background: "#fff" }} />
        {st.short}
      </span>
    );
  }
  return (
    <span className="stg" style={{ background: st.c + "33", color: "var(--ink)", borderColor: st.c }}>
      <i className="sq" style={{ background: st.c }} />
      {st.short}
    </span>
  );
}
