"use client";

import { useEffect, useRef } from "react";
import { useApp } from "../app-context";
import { deleteProjectAction } from "@/app/actions/board";
import { cmOf, evOf } from "@/lib/analytics";
import { confirmDelete, showDeleted } from "@/lib/delete-confirmation";

export default function DeleteModal({ projectId }: { projectId: string }) {
  const { projects, events, comments, closeModal, toast, refresh } = useApp();
  const started = useRef(false);
  const p = projects.find((x) => x.id === projectId);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function run() {
      if (!p) {
        closeModal();
        return;
      }
      const ne = evOf(events, projectId).length;
      const nc = cmOf(comments, projectId).length;
      const confirmed = await confirmDelete(
        `${p.product} · ${p.dtype} · ${p.market} and its ${ne} log entries and ${nc} chat messages will be permanently deleted.`,
      );
      if (!confirmed) {
        closeModal();
        return;
      }
      try {
        await deleteProjectAction(projectId);
        await refresh();
        await showDeleted(`${p.product} · ${p.dtype} has been deleted.`);
      } catch (err) {
        toast("Delete failed", err instanceof Error ? err.message : String(err), "bad");
      } finally {
        closeModal();
      }
    }
    void run();
  }, [closeModal, comments, events, p, projectId, refresh, toast]);

  return null;
}
