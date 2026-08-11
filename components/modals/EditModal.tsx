"use client";

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import { useApp } from "../app-context";
import { editAction } from "@/app/actions/board";
import { DTYPES, MARKETS, peopleIn } from "@/lib/domain";

export default function EditModal({ projectId }: { projectId: string }) {
  const { projects, closeModal, toast, refresh } = useApp();
  const [busy, setBusy] = useState(false);
  const p = projects.find((x) => x.id === projectId);
  useEffect(() => {
    if (!p) closeModal();
  }, [p, closeModal]);
  if (!p) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const { changed } = await editAction({
        projectId,
        product: String(fd.get("product") || ""),
        asin: String(fd.get("asin") || ""),
        dtype: String(fd.get("dtype") || ""),
        market: String(fd.get("market") || ""),
        priority: String(fd.get("priority") || "med") as "high" | "med" | "low",
        designer: String(fd.get("designer") || ""),
        dueDate: String(fd.get("due") || "") || null,
        ticketId: String(fd.get("ticket") || ""),
        lead: String(fd.get("lead") || ""),
        head: String(fd.get("head") || ""),
        pm: String(fd.get("pm") || ""),
        briefUrl: String(fd.get("brief") || ""),
        workUrl: String(fd.get("work") || ""),
      });
      await refresh();
      closeModal();
      toast("Saved", changed ? `${changed} field(s) updated.` : "Nothing changed.", "ok");
    } catch (err) {
      toast("Save failed", err instanceof Error ? err.message : String(err), "bad");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Edit project">
      <form onSubmit={onSubmit}>
        <div className="modal-b">
          <div className="frow">
            <label className="f1">
              <span>Product</span>
              <input name="product" defaultValue={p.product} />
            </label>
            <label className="f1">
              <span>ASIN</span>
              <input name="asin" defaultValue={p.asin || ""} />
            </label>
          </div>
          <div className="frow">
            <label className="f1">
              <span>Deliverable</span>
              <select name="dtype" defaultValue={p.dtype}>
                {DTYPES.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="f1">
              <span>Market</span>
              <select name="market" defaultValue={p.market}>
                {MARKETS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="f1">
              <span>Priority</span>
              <select name="priority" defaultValue={p.priority}>
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
          </div>
          <div className="frow">
            <label className="f1">
              <span>Designer</span>
              <select name="designer" defaultValue={p.designer || ""}>
                {peopleIn("designer").map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="f1">
              <span>Due date</span>
              <input type="date" name="due" defaultValue={(p.dueDate || "").slice(0, 10)} />
            </label>
            <label className="f1">
              <span>Ticket ID</span>
              <input name="ticket" defaultValue={p.ticketId || ""} />
            </label>
          </div>
          <div className="frow">
            <label className="f1">
              <span>Team Lead</span>
              <select name="lead" defaultValue={p.lead || ""}>
                {peopleIn("lead").map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="f1">
              <span>Team Head</span>
              <select name="head" defaultValue={p.head || ""}>
                {peopleIn("head").map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <label className="f1">
              <span>Project Manager</span>
              <select name="pm" defaultValue={p.pm || ""}>
                {peopleIn("pm").map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="frow">
            <label className="f1">
              <span>Brief link</span>
              <input name="brief" defaultValue={p.briefUrl || ""} placeholder="https://…" />
            </label>
            <label className="f1">
              <span>Working files link</span>
              <input name="work" defaultValue={p.workUrl || ""} placeholder="https://…" />
            </label>
          </div>
        </div>
        <div className="modal-f">
          <button type="button" className="btn" onClick={closeModal}>
            Cancel
          </button>
          <button type="submit" className="btn pri" disabled={busy}>
            Save
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
