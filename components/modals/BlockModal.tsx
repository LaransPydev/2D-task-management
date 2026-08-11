"use client";

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import { useApp } from "../app-context";
import { blockAction, unblockAction } from "@/app/actions/board";

export default function BlockModal({ projectId }: { projectId: string }) {
  const { projects, closeModal, toast, refresh } = useApp();
  const [busy, setBusy] = useState(false);
  const p = projects.find((x) => x.id === projectId);
  useEffect(() => {
    if (!p) closeModal();
  }, [p, closeModal]);
  if (!p) return null;

  if (p.blocked) {
    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const note = String(new FormData(e.currentTarget).get("note") || "").trim();
      setBusy(true);
      try {
        await unblockAction({ projectId, note });
        await refresh();
        closeModal();
        toast("Cleared", "Back in motion.", "ok");
      } catch (err) {
        toast("Save failed", err instanceof Error ? err.message : String(err), "bad");
      } finally {
        setBusy(false);
      }
    }
    return (
      <ModalShell title="Clear the block">
        <form onSubmit={onSubmit}>
          <div className="modal-b">
            <div className="callout">
              <div>
                Current block on <b>{p.product}</b>:<br />
                {p.blockReason || "—"}
              </div>
            </div>
            <label className="f1">
              <span>What unblocked it?</span>
              <textarea name="note" rows={2} placeholder="e.g. FR copy signed off by Marie" />
            </label>
          </div>
          <div className="modal-f">
            <button type="button" className="btn" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit" className="btn ok" disabled={busy}>
              Clear block
            </button>
          </div>
        </form>
      </ModalShell>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const reason = String(new FormData(e.currentTarget).get("reason") || "").trim();
    if (!reason) return toast("Missing", "Say what is blocking it — “blocked” with no reason is the thing you are trying to get rid of.", "bad");
    setBusy(true);
    try {
      await blockAction({ projectId, reason });
      await refresh();
      closeModal();
      toast("Flagged", "Blocked and visible in Needs attention.", "bad");
    } catch (err) {
      toast("Save failed", err instanceof Error ? err.message : String(err), "bad");
    } finally {
      setBusy(false);
    }
  }
  return (
    <ModalShell title="Flag as blocked">
      <form onSubmit={onSubmit}>
        <div className="modal-b">
          <div className="callout warn">
            <div>
              Blocking keeps the stage but marks the project as <b>not moving and not the owner&apos;s fault</b>. It is the honest answer to &ldquo;why is
              this pending&rdquo;.
            </div>
          </div>
          <label className="f1">
            <span>
              What is blocking it, and who can unblock it? <em>*</em>
            </span>
            <textarea name="reason" rows={3} placeholder="e.g. Waiting on the FR copy sign-off — nobody assigned since 24 July" />
          </label>
        </div>
        <div className="modal-f">
          <button type="button" className="btn" onClick={closeModal}>
            Cancel
          </button>
          <button type="submit" className="btn bad" disabled={busy}>
            Flag blocked
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
