"use client";

import { useState } from "react";
import ModalShell from "./ModalShell";
import { useApp } from "../app-context";
import { addDesignerAction, removeDesignerAction } from "@/app/actions/board";

export default function ManageDesignersModal() {
  const { designers, closeModal, toast, refresh } = useApp();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await addDesignerAction({ name: name.trim() });
      await refresh();
      toast("Added", `${name.trim()} added to the roster.`, "ok");
      setName("");
    } catch (err) {
      toast("Failed", err instanceof Error ? err.message : String(err), "bad");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(n: string) {
    setBusy(true);
    try {
      await removeDesignerAction(n);
      await refresh();
      toast("Removed", `${n} removed from the roster.`, "ok");
    } catch (err) {
      toast("Failed", err instanceof Error ? err.message : String(err), "bad");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Manage Designers">
      <form onSubmit={onAdd} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Designer full name"
          style={{ flex: 1, padding: "6px 10px", border: "1px solid var(--brd)", borderRadius: 6, fontSize: 13 }}
          disabled={busy}
          autoFocus
        />
        <button type="submit" className="btn pri" disabled={busy || !name.trim()}>
          + Add
        </button>
      </form>
      {designers.length === 0 ? (
        <p style={{ color: "var(--tx-3)", fontSize: 13 }}>No designers added yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {designers.map((d) => (
            <li key={d} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: "1px solid var(--brd)", borderRadius: 6, fontSize: 13 }}>
              <span>{d}</span>
              <button onClick={() => onRemove(d)} disabled={busy} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tx-3)", fontSize: 20, lineHeight: 1, padding: "0 4px" }} title="Remove">×</button>
            </li>
          ))}
        </ul>
      )}
    </ModalShell>
  );
}
