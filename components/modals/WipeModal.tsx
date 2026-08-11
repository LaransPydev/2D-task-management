"use client";

import { useState } from "react";
import ModalShell from "./ModalShell";
import { useApp } from "../app-context";
import { wipeAllAction } from "@/app/actions/board";

export default function WipeModal() {
  const { projects, closeModal, toast, refresh } = useApp();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState("");

  async function onWipe() {
    setBusy(true);
    try {
      const { count } = await wipeAllAction(confirm);
      await refresh();
      closeModal();
      toast("Board cleared", `${count} projects removed. Add your first real project with + New project.`, "bad");
    } catch (err) {
      toast("Delete failed", err instanceof Error ? err.message : String(err), "bad");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Clear the whole board">
      <div className="modal-b">
        <div className="callout bad">
          <div>
            <b>This deletes all {projects.length} projects</b> with their logs and chats. It exists for one job: wiping the sample data before your team
            puts real work on the board. After that, delete projects one at a time.
          </div>
        </div>
        <label className="f1">
          <span>Type DELETE to confirm</span>
          <input placeholder="DELETE" autoComplete="off" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
      </div>
      <div className="modal-f">
        <button className="btn" onClick={closeModal}>
          Cancel
        </button>
        <button className="btn bad" disabled={busy} onClick={onWipe}>
          Clear the board
        </button>
      </div>
    </ModalShell>
  );
}
