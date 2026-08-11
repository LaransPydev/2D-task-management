"use client";

import { useEffect } from "react";
import { useApp } from "../app-context";

export function ModalHeader({ title }: { title: string }) {
  const { closeModal } = useApp();
  return (
    <div className="modal-h">
      <h3>{title}</h3>
      <button className="x" onClick={closeModal}>
        ✕
      </button>
    </div>
  );
}

export default function ModalShell({ title, wide, children }: { title: string; wide?: boolean; children: React.ReactNode }) {
  const { closeModal } = useApp();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeModal]);

  return (
    <div
      className="ovl"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className={"modal" + (wide ? " wide" : "")}>
        <ModalHeader title={title} />
        {children}
      </div>
    </div>
  );
}
