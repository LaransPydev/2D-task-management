"use client";

import {
  AGE_CRIT,
  AGE_WARN,
  LOOP_ANCHOR,
  LOOPS,
  MOVES,
  RAIL,
  S,
  ago,
  avColor,
  ballWith,
  canAct,
  canEdit,
  daysBetween,
  evVerb,
  fmtDate,
  fmtStamp,
  initials,
  isOverdue,
  shortType,
  whyNot,
  type ProjectRow,
} from "@/lib/domain";
import { cmOf, evOf, lastEv } from "@/lib/analytics";
import { useApp } from "../app-context";
import StagePill from "./StagePill";
import LogPane from "./LogPane";
import ChatPane from "./ChatPane";
import DetailsPane from "./DetailsPane";

export default function ProjectCard({ p }: { p: ProjectRow }) {
  const { user, isFull, isReadonly, events, comments, open, toggleOpen, dtab, setDtab, openModal } = useApp();
  const st = S[p.stage];
  const ev = evOf(events, p.id);
  const cm = cmOf(comments, p.id);
  const le = lastEv(events, p.id);
  const d = daysBetween(p.stageSince);
  const ageCls = d >= AGE_CRIT ? "crit" : d >= AGE_WARN ? "hot" : "";
  const b = ballWith(p);
  const isOpen = open.has(p.id);
  const dt = dtab[p.id] || "log";
  const railIdx = RAIL.indexOf(st.id);
  const inLoop = LOOPS.has(st.id);
  const loopAnchor = LOOP_ANCHOR[st.id];
  const anchorIdx = inLoop ? RAIL.indexOf(loopAnchor) : railIdx;
  const revs = (p.revLead || 0) + (p.revHead || 0) + (p.revAmz || 0);
  const editable = canEdit(user, p);

  return (
    <article className={"card" + (p.blocked ? " blocked" : "")} data-p={p.id}>
      <div className="card-top">
        <div className="tbadge" title={p.dtype}>
          {shortType(p.dtype)}
        </div>
        <div className="card-id">
          <h3>
            {p.product}
            <StagePill st={st} />
          </h3>
          <div className="meta">
            <span className="pin">{p.dtype}</span>·<span className="mkt">{p.market}</span>
            <span>{p.asin || "no ASIN"}</span>·<span className={"pri-f " + p.priority}>{p.priority}</span>
            {p.ticketId && <>·<span>🎫 {p.ticketId}</span></>}
            {isOverdue(p) ? (
              <>
                ·<span style={{ color: "var(--ink)", fontWeight: 600 }}>due {fmtDate(p.dueDate)} · overdue</span>
              </>
            ) : (
              <>·<span>due {fmtDate(p.dueDate)}</span></>
            )}
            {revs > 0 && (
              <>
                ·<span title="revisions">↺ {revs}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rail">
        {RAIL.map((id, i) => {
          if (p.stage === "done") return <i key={id} className="cur" style={{ "--rc": S.done.c } as React.CSSProperties} title={S[id].label} />;
          const cls = i < anchorIdx ? "done" : i === anchorIdx ? (inLoop ? "loop" : "cur") : "";
          return <i key={id} className={cls} style={{ "--rc": inLoop ? "#25282A" : st.c } as React.CSSProperties} title={S[id].label} />;
        })}
      </div>

      <div className="latest">
        <span className="ic">{le ? (le.kind === "comment" ? "💬" : le.kind === "create" ? "◆" : "▸") : "·"}</span>
        <div className="bd">
          {le ? (
            <>
              <p>
                <b>{le.actor}</b> {evVerb(le)}
                {le.note && <> — <em>&ldquo;{le.note}&rdquo;</em></>}
              </p>
              <span className="ts">
                {fmtStamp(le.at)} · {ago(le.at)}
              </span>
            </>
          ) : (
            <p>
              <em>No activity logged yet. First step: start the concept.</em>
            </p>
          )}
        </div>
      </div>

      <div className="ball">
        <span className="k">Ball with</span>
        <span className="p">
          <i className="av" style={{ background: avColor(b.name) }} title={b.name}>
            {initials(b.name)}
          </i>{" "}
          {b.name}
        </span>
        <span style={{ color: "var(--tx-3)", fontSize: 10.5 }}>({b.role})</span>
        <span className="spacer" />
        <span className={"age " + ageCls}>
          {d}d in {st.short}
        </span>
      </div>

      {p.blocked && (
        <div className="blockmsg">
          <b>Blocked</b>
          <span>{p.blockReason || "No reason given."}</span>
        </div>
      )}

      {!isReadonly && (
        <div className="acts">
          {(MOVES[p.stage] || []).map((mv) => {
            const ok = canAct(user, p, mv);
            return (
              <button
                key={mv.to}
                className={"btn sm " + mv.st}
                disabled={!ok}
                title={ok ? mv.lb : whyNot(user, p, mv)}
                onClick={() => openModal({ kind: "move", projectId: p.id, to: mv.to })}
              >
                {mv.lb}
              </button>
            );
          })}
          <span className="spacer" />
          {editable && (
            <>
              <button className="btn sm gh" onClick={() => openModal({ kind: "block", projectId: p.id })}>
                {p.blocked ? "Unblock" : "Flag blocked"}
              </button>
              <button className="btn sm gh" onClick={() => openModal({ kind: "edit", projectId: p.id })}>
                Edit
              </button>
            </>
          )}
          {isFull && (
            <button className="btn sm gh" title="Delete this project and its whole history" onClick={() => openModal({ kind: "del", projectId: p.id })}>
              Delete
            </button>
          )}
        </div>
      )}

      <button className={"tgl" + (isOpen ? " open" : "")} onClick={() => toggleOpen(p.id)}>
        <span className="l">
          <span className="car">▶</span> Full log &amp; chat
        </span>
        <span className="l">
          <span className="badge">{ev.length} events</span>
          <span className="badge">{cm.length} messages</span>
        </span>
      </button>

      <div className={"drawer" + (isOpen ? " open" : "")}>
        <div>
          <div className="drawer-in">
            {isOpen && (
              <>
                <div className="dtabs">
                  <button className={dt === "log" ? "on" : ""} onClick={() => setDtab(p.id, "log")}>
                    Activity log
                  </button>
                  <button className={dt === "chat" ? "on" : ""} onClick={() => setDtab(p.id, "chat")}>
                    Chat {cm.length ? `(${cm.length})` : ""}
                  </button>
                  <button className={dt === "det" ? "on" : ""} onClick={() => setDtab(p.id, "det")}>
                    Details
                  </button>
                </div>
                <div className="dpane">
                  {dt === "log" && <LogPane events={ev} />}
                  {dt === "chat" && <ChatPane p={p} comments={cm} />}
                  {dt === "det" && <DetailsPane p={p} events={ev} />}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
