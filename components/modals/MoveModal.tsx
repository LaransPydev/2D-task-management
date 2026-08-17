"use client";

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import { useApp } from "../app-context";
import { moveStageAction } from "@/app/actions/board";
import { MOVES, REJECT_REASONS, S, ballWith } from "@/lib/domain";

export default function MoveModal({ projectId, to }: { projectId: string; to: string }) {
  const { projects, closeModal, toast, refresh } = useApp();
  const [busy, setBusy] = useState(false);
  const p = projects.find((x) => x.id === projectId);
  const mv = p ? (MOVES[p.stage] || []).find((m) => m.to === to) : null;
  const missing = !p || !mv;
  // The project can vanish out from under an open modal (someone else deleted
  // it, or this exact move already landed) -- close on the next tick rather
  // than calling setState synchronously while this component is rendering.
  useEffect(() => {
    if (missing) closeModal();
  }, [missing, closeModal]);
  if (!p || !mv) return null;
  const isRej = to === "amz_rej";
  const isRev = to === "lead_fix" || to === "head_fix";
  const isTicket = to === "ticket";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const note = String(fd.get("note") || "").trim();
    const reason = String(fd.get("reason") || "");
    const ticket = String(fd.get("ticket") || "").trim();
    const ticketType = String(fd.get("ticketType") || "") as "" | "A/B Testing" | "Listing adjustment";
    setBusy(true);
    try {
      const updated = await moveStageAction({ projectId, to, note, reason, ticket, ticketType });
      await refresh();
      closeModal();
      toast("Moved", `${updated.product} → ${S[to].label}. Ball with ${ballWith(updated).name}.`, to === "done" ? "ok" : "");
    } catch (err) {
      toast("Save failed", err instanceof Error ? err.message : String(err), "bad");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title={mv.lb}>
      <form onSubmit={onSubmit}>
        <div className="modal-b">
          <div className={"callout" + (isRej ? " bad" : isRev ? " warn" : "")}>
            <div>
              <b>
                {p.product} · {p.dtype} · {p.market}
              </b>
              <br />
              {S[p.stage].label} &nbsp;▶&nbsp; <b>{S[to].label}</b>
              <br />
              <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--tx-3)" }}>Ball moves to {ballWith({ ...p, stage: to }).name}</span>
            </div>
          </div>
          {isRej && (
            <label className="f1" style={{ marginBottom: 12 }}>
              <span>
                Amazon&apos;s reason <em>*</em>
              </span>
              <select name="reason" defaultValue={REJECT_REASONS[0]}>
                {REJECT_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
          )}
          {isTicket && (
            <>
              <label className="f1" style={{ marginBottom: 12 }}>
                <span>
                  Ticket / case ID <em>*</em>
                </span>
                <input name="ticket" placeholder="e.g. CS-88421" defaultValue={p.ticketId || ""} required />
              </label>
              <label className="f1" style={{ marginBottom: 12 }}>
                <span>
                  Ticket <em>*</em>
                </span>
                <select name="ticketType" defaultValue={p.ticketType || ""} required>
                  <option value="" disabled>Select ticket type…</option>
                  <option value="A/B Testing">A/B Testing</option>
                  <option value="Listing adjustment">Listing adjustment</option>
                </select>
              </label>
            </>
          )}
          <label className="f1">
            <span>{mv.need ? mv.need + " *" : "Note (optional but recommended)"}</span>
            <textarea name="note" rows={3} placeholder={isRev ? "Be specific — vague notes are why things loop twice." : "What changed, what to watch for…"} />
          </label>
          <p className="hintline">
            {mv.need
              ? "Required. This is the text the designer sees and the reason the log can answer “why is this pending” without anyone asking."
              : "Skipping the note is allowed, but then nobody can reconstruct why later."}
          </p>
        </div>
        <div className="modal-f">
          <button type="button" className="btn" onClick={closeModal}>
            Cancel
          </button>
          <button type="submit" className={"btn " + (mv.st === "gh" ? "pri" : mv.st)} disabled={busy}>
            {mv.lb}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
