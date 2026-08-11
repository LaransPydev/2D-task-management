"use client";

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import { useApp } from "../app-context";
import { deleteProjectAction } from "@/app/actions/board";
import { cmOf, evOf } from "@/lib/analytics";

export default function DeleteModal({ projectId }: { projectId: string }) {
  const { projects, events, comments, closeModal, toast, refresh } = useApp();
  const [busy, setBusy] = useState(false);
  const p = projects.find((x) => x.id === projectId);
  useEffect(() => {
    if (!p) closeModal();
  }, [p, closeModal]);
  if (!p) return null;
  const ne = evOf(events, projectId).length;
  const nc = cmOf(comments, projectId).length;

  async function onDelete() {
    setBusy(true);
    try {
      await deleteProjectAction(projectId);
      await refresh();
      closeModal();
      toast("Deleted", `${p!.product} · ${p!.dtype} and its full history are gone.`, "bad");
    } catch (err) {
      toast("Delete failed", err instanceof Error ? err.message : String(err), "bad");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Delete project">
      <div className="modal-b">
        <div className="callout bad">
          <div>
            <b>
              {p.product} · {p.dtype} · {p.market}
            </b>
            <br />
            This removes the project along with its {ne} log entries and {nc} chat messages. It cannot be undone, and the work vanishes from every monthly
            figure it contributed to.
          </div>
        </div>
        <p className="hintline">
          If you only want it off the active board, move it to <b>Live</b> instead — that keeps the history and keeps your throughput numbers honest.
        </p>
      </div>
      <div className="modal-f">
        <button className="btn" onClick={closeModal}>
          Keep it
        </button>
        <button className="btn bad" disabled={busy} onClick={onDelete}>
          Delete permanently
        </button>
      </div>
    </ModalShell>
  );
}
