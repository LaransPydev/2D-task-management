"use client";

import { useState } from "react";
import ModalShell from "./ModalShell";
import { useApp } from "../app-context";
import { addMarketAction, removeMarketAction } from "@/app/actions/board";

export default function ManageMarketsModal() {
  const { dbMarkets, closeModal, toast, refresh } = useApp();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await addMarketAction({ name: name.trim() });
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
      await removeMarketAction(n);
      await refresh();
      toast("Removed", `"${n}" removed.`, "ok");
    } catch (err) {
      toast("Failed", err instanceof Error ? err.message : String(err), "bad");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModalShell title="Manage Markets">
      <form onSubmit={onAdd} style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. UK" style={{ flex: 1, padding: "6px 10px", border: "1px solid var(--brd)", borderRadius: 6, fontSize: 13 }} disabled={busy} autoFocus />
        <button type="submit" className="btn pri" disabled={busy || !name.trim()}>+ Add</button>
      </form>
      {dbMarkets.length === 0 ? (
        <p style={{ color: "var(--tx-3)", fontSize: 13 }}>No markets yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {dbMarkets.map((m) => (
            <li key={m} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", border: "1px solid var(--brd)", borderRadius: 6, fontSize: 13 }}>
              <span>{m}</span>
              <button onClick={() => onRemove(m)} disabled={busy} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--tx-3)", fontSize: 20, lineHeight: 1, padding: "0 4px" }}>×</button>
            </li>
          ))}
        </ul>
      )}
    </ModalShell>
  );
}
