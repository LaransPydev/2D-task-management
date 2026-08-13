"use client";

import { useState } from "react";
import ModalShell from "./ModalShell";
import { useApp } from "../app-context";
import { createProjectAction } from "@/app/actions/board";
import { DTYPES, MARKETS, peopleIn } from "@/lib/domain";

function inNDays(n: number) {
  return new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
}

export default function NewProjectModal() {
  const { user, closeModal, toast, refresh, setManyOpen, designers: dbDesigners, dbDtypes, dbMarkets } = useApp();
  const [busy, setBusy] = useState(false);
  // Designers have no fixed roster entry — the only valid names are the ones
  // the team has added via Manage Roster (see lib/data.ts). Deliverable
  // types and markets keep their built-in-first ordering: built-ins first,
  // then any custom additions — so the first (default-selected) option is
  // always a predictable built-in, never whichever DB row happens to have
  // the earliest createdAt.
  const designers = dbDesigners;
  const userDtypes = dbDtypes.filter((d) => !DTYPES.includes(d));
  const allDtypes = userDtypes.length > 0 ? userDtypes : DTYPES;
  const userMarkets = dbMarkets.filter((m) => !MARKETS.includes(m));
  const allMarkets = userMarkets.length > 0 ? userMarkets : MARKETS;
  const leads = peopleIn("lead");
  const heads = peopleIn("head");
  const pms = peopleIn("pm");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const product = String(fd.get("product") || "").trim();
    const designer = String(fd.get("designer") || "");
    const due = String(fd.get("due") || "").trim();
    const lead = String(fd.get("lead") || "").trim();
    const head = String(fd.get("head") || "").trim();
    if (!product) return toast("Missing", "Product name is required.", "bad");
    if (!designer) return toast("Missing", "A designer has to own it, otherwise nobody has the ball.", "bad");
    if (!due) return toast("Missing", "Due date is required.", "bad");
    if (!lead) return toast("Missing", "Team Lead is required.", "bad");
    if (!head) return toast("Missing", "Team Head is required.", "bad");
    setBusy(true);
    try {
      const created = await createProjectAction({
        product,
        asin: String(fd.get("asin") || ""),
        dtype: String(fd.get("dtype")),
        market: String(fd.get("market")),
        designer,
        lead: lead,
        head: head,
        pm: String(fd.get("pm") || ""),
        priority: String(fd.get("priority") || "med") as "high" | "med" | "low",
        dueDate: due || null,
        note: String(fd.get("note") || ""),
      });
      await refresh();
      setManyOpen([created.id], true);
      closeModal();
      toast("Created", `${product} · ${created.dtype} is on the board.`, "ok");
    } catch (err) {
      toast("Save failed", err instanceof Error ? err.message : String(err), "bad");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title="New project">
      <form onSubmit={onSubmit}>
        <div className="modal-b">
          <div className="callout">
            <div>
              One project = <b>one product + one deliverable type + one market</b>. Track the gallery and the A+ page separately, or you lose sight of the
              one that is stuck.
            </div>
          </div>
          <div className="frow">
            <label className="f1">
              <span>
                Product name <em>*</em>
              </span>
              <input name="product" placeholder="e.g. WP300 Walking Pad" required />
            </label>
            <label className="f1">
              <span>ASIN</span>
              <input name="asin" placeholder="B0…" />
            </label>
          </div>
          <div className="frow">
            <label className="f1">
              <span>
                Deliverable <em>*</em>
              </span>
              <select name="dtype" defaultValue={allDtypes[0]}>
                {allDtypes.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="f1">
              <span>Market <em>*</em></span>
              <select name="market" defaultValue={allMarkets[0]}>
                {allMarkets.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="f1">
              <span>Priority <em>*</em></span>
              <select name="priority" defaultValue="med">
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
            </label>
          </div>
          <div className="frow">
            <label className="f1">
              <span>
                Designer <em>*</em>
              </span>
              <select name="designer" defaultValue={user.role === "designer" ? user.name : ""}>
                <option value="" disabled>
                  Select…
                </option>
                {designers.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="f1">
              <span>Due date <em>*</em></span>
              <input type="date" name="due" defaultValue={inNDays(7)} required />
            </label>
          </div>
          <div className="frow">
            <label className="f1">
              <span>Team Lead <em>*</em></span>
              <select name="lead" defaultValue={user.role === "lead" ? user.name : leads[0] || ""} required>
                {leads.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="f1">
              <span>Team Head <em>*</em></span>
              <select name="head" defaultValue={user.role === "head" ? user.name : heads[0] || ""} required>
                {heads.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="f1">
              <span>Project Manager</span>
              <select name="pm" defaultValue={user.role === "pm" ? user.name : pms[0] || ""}>
                {pms.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="f1">
            <span>Opening note</span>
            <textarea name="note" rows={2} placeholder="Why this product, what the goal of the update is…" />
          </label>
        </div>
        <div className="modal-f">
          <button type="button" className="btn" onClick={closeModal}>
            Cancel
          </button>
          <button type="submit" className="btn pri" disabled={busy}>
            Create project
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
