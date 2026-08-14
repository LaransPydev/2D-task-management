"use client";

import { useEffect, useRef } from "react";
import { useApp } from "../app-context";
import { wipeAllAction } from "@/app/actions/board";
import { confirmClearBoard, showDeleted } from "@/lib/delete-confirmation";

export default function WipeModal() {
  const { projects, closeModal, toast, refresh } = useApp();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function run() {
      if (!(await confirmClearBoard(projects.length))) {
        closeModal();
        return;
      }
      try {
        const { count } = await wipeAllAction("DELETE");
        await refresh();
        await showDeleted(`${count} projects and their history have been deleted.`);
      } catch (err) {
        toast("Delete failed", err instanceof Error ? err.message : String(err), "bad");
      } finally {
        closeModal();
      }
    }
    void run();
  }, [closeModal, projects.length, refresh, toast]);

  return null;
}
