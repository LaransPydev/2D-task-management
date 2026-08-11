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
  const { user, closeModal, toast, refresh, setManyOpen } = useApp();
  const [busy, setBusy] = useState(false);
  const designers = peopleIn("designer");
  const leads = peopleIn("lead");
  const heads = peopleIn("head");
  const pms = peopleIn("pm");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const product = String(fd.get("product") || "").trim();
    const designer = String(fd.get("designer") || "");
    if (!product) return toast("Missing", "Product name is required.", "bad");
    if (!designer) return toast("Missing", "A designer has to own it, otherwise nobody has the ball.", "bad");
    setBusy(true);
    try {
      const created = await createProjectAction({
        product,
        asin: String(fd.get("asin") || ""),
        dtype: String(fd.get("dtype")),
        market: String(fd.get("market")),
        designer,
        lead: String(fd.get("lead") || ""),
        head: String(fd.get("head") || ""),
        pm: String(fd.get("pm") || ""),
        priority: String(fd.get("priority") || "med") as "high" | "med" | "low",
        dueDate: String(fd.get("due") || "") || null,
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
              <select name="dtype" defaultValue={DTYPES[0]}>
                {DTYPES.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="f1">
              <span>Market</span>
              <select name="market" defaultValue={MARKETS[0]}>
                {MARKETS.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="f1">
              <span>Priority</span>
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
              <span>Due date</span>
              <input type="date" name="due" defaultValue={inNDays(7)} />
            </label>
          </div>
          <div className="frow">
            <label className="f1">
              <span>Team Lead</span>
              <select name="lead" defaultValue={user.role === "lead" ? user.name : leads[0] || ""}>
                {leads.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="f1">
              <span>Team Head</span>
              <select name="head" defaultValue={user.role === "head" ? user.name : heads[0] || ""}>
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
