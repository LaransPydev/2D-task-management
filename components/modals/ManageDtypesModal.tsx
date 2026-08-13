"use client";

import { useState } from "react";
import ModalShell from "./ModalShell";
import { useApp } from "../app-context";
import { addDeliverableTypeAction, removeDeliverableTypeAction } from "@/app/actions/board";
import { DTYPES } from "@/lib/domain";

export default function ManageDtypesModal() {
  const { dbDtypes, closeModal, toast, refresh } = useApp();
  const userDtypes = dbDtypes.filter((d) => !DTYPES.includes(d));
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await addDeliverableTypeAction({ name: name.trim() });
      await refresh();
      toast("Added", `"${name.trim()}" added.`, "ok");
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
      await removeDeliverableTypeAction(n);
      await refresh();
      toast("Removed", `"${n}" removed.`, "ok");
    } catch (err) {
      toast("Failed", err instanceof Error ? err.message : String(err), "bad");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Manage Deliverable Types">
      <form onSubmit={onAdd} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Packaging Design" style={{ flex: 1, padding: "6px 10px", border: "1px solid var(--brd)", borderRadius: 6, fontSize: 13 }} disabled={busy} autoFocus />
        <button type="submit" className="btn pri" disabled={busy || !name.trim()}>+ Add</button>
      </form>
      <p style={{ fontSize: 11, color: "var(--tx-3)", marginBottom: 12 }}>Built-in: {DTYPES.join(", ")}</p>
      {userDtypes.length === 0 ? (
        <p style={{ color: "var(--tx-3)", fontSize: 13 }}>No custom types added yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {userDtypes.map((d) => (
            <li key={d} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: "1px solid var(--brd)", borderRadius: 6, fontSize: 13 }}>
              <span>{d}</span>
              <button onClick={() => onRemove(d)} disabled={busy} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tx-3)", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
            </li>
          ))}
        </ul>
      )}
    </ModalShell>
  );
}
