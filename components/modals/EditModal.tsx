"use client";

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import { useApp } from "../app-context";
import { editAction } from "@/app/actions/board";
import { DTYPES, MARKETS, peopleIn } from "@/lib/domain";

export default function EditModal({ projectId }: { projectId: string }) {
  const { projects, dbDtypes, dbMarkets, designers: dbDesigners, closeModal, toast, refresh } = useApp();
  const [busy, setBusy] = useState(false);
  const p = projects.find((x) => x.id === projectId);
  useEffect(() => {
    if (!p) closeModal();
  }, [p, closeModal]);
  if (!p) return null;

  // Built-ins alone aren't enough here: a project's current dtype/market/
  // designer may be a custom value added via Manage Roster. If the <select>
  // doesn't include it as an option, the browser silently selects whatever
  // option happens to be first, and hitting Save (even to change an unrelated
  // field) would silently overwrite the real value with that wrong default.
  // Union the current value in so it's always selectable — and always saved
  // back as itself unless the user deliberately changes it.
  const dtypeOptions = Array.from(new Set([p.dtype, ...(dbDtypes.length > 0 ? dbDtypes : DTYPES)].filter(Boolean)));
  const marketOptions = Array.from(new Set([p.market, ...(dbMarkets.length > 0 ? dbMarkets : MARKETS)].filter(Boolean)));
  // Designers have no fixed-roster fallback — dbDesigners (Manage Roster) is
  // the only source, unioned with the project's current value so a project
  // assigned before a designer was removed from the roster still shows it.
  const designerOptions = Array.from(new Set([p.designer, ...dbDesigners].filter(Boolean)));

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
                {dtypeOptions.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="f1">
              <span>Market</span>
              <select name="market" defaultValue={p.market}>
                {marketOptions.map((d) => (
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
                {designerOptions.map((n) => (
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
