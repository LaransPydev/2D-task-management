"use client";

import { useState } from "react";
import ModalShell from "./ModalShell";
import { useApp } from "../app-context";
import {
  addDesignerAction, removeDesignerAction,
  addDeliverableTypeAction, removeDeliverableTypeAction,
  addMarketAction, removeMarketAction,
} from "@/app/actions/board";
import { DTYPES, MARKETS, initials, avColor } from "@/lib/domain";

type Tab = "designers" | "dtypes" | "markets";

function Section({
  items, builtIn, placeholder, isDesigner, onAdd, onRemove, busy,
}: {
  items: string[]; builtIn: string[]; placeholder: string; isDesigner?: boolean;
  onAdd: (n: string) => Promise<void>; onRemove: (n: string) => Promise<void>; busy: boolean;
}) {
  const [val, setVal] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!val.trim()) return;
    await onAdd(val.trim());
    setVal("");
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <form onSubmit={submit} style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={val} onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder} disabled={busy} autoFocus
          style={{
            flex: 1, padding: "9px 14px", border: "1.5px solid #D1D5DB", borderRadius: 10,
            fontSize: 13, outline: "none", background: "#FAFBFB", transition: "border-color .15s",
          }}
          onFocus={e => (e.target.style.borderColor = "#0071E3")}
          onBlur={e => (e.target.style.borderColor = "#D1D5DB")}
        />
        <button type="submit" className="btn pri" disabled={busy || !val.trim()}
          style={{ borderRadius: 10, padding: "9px 18px", fontSize: 13, whiteSpace: "nowrap" }}>
          + Add
        </button>
      </form>

      {/* {builtIn.length > 0 && (
        <p style={{ fontSize: 11, color: "#8E9294", margin: "-8px 0 0" }}>
          Built-in (fixed, cannot be removed here): {builtIn.join(", ")}
        </p>
      )} */}

      <div style={{ minHeight: 60 }}>
        {items.length === 0 && builtIn.length === 0 ? (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            height: 60, borderRadius: 10, border: "1.5px dashed #E4E7E9",
            color: "#A0A5A8", fontSize: 13,
          }}>
            Nothing added yet — type above and click + Add
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {builtIn.map((item) => (
              <div key={item} style={{
                display: "inline-flex", alignItems: "center",
                height: 36, padding: "0 16px",
                borderRadius: 999, background: "#F4F5F6", border: "1px solid #DCDFE2",
                fontSize: 13, fontWeight: 500, color: "#5F6365",
              }}>
                {item}
              </div>
            ))}
            {items.map((item) => (
              <div key={item} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                height: 36,
                paddingLeft: isDesigner ? 6 : 14,
                paddingRight: 10,
                borderRadius: 999, background: "#EEF4FF", border: "1px solid #C5D8F8",
                fontSize: 13, fontWeight: 500, color: "#1A1D1F",
              }}>
                {isDesigner && (
                  <i style={{
                    width: 26, height: 26, borderRadius: "50%", background: avColor(item),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, color: "#fff", fontStyle: "normal", fontWeight: 700, flexShrink: 0,
                  }}>
                    {initials(item)}
                  </i>
                )}
                <span>{item}</span>
                <button onClick={() => onRemove(item)} disabled={busy} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 20, height: 20, borderRadius: "50%", background: "#C8DCF8",
                  border: "none", cursor: "pointer", color: "#2E67C4",
                  fontSize: 14, lineHeight: 1, padding: 0, flexShrink: 0, fontWeight: 400,
                }}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ManageRosterModal() {
  const { designers, dbDtypes, dbMarkets, toast, refresh } = useApp();
  const [tab, setTab] = useState<Tab>("designers");
  const [busy, setBusy] = useState(false);

  // Deliverable types and markets are seeded into the DB with the fixed
  // built-in list (see lib/data.ts ensureBuiltIns) and must stay
  // non-removable — filter them out of the editable list. Designers have no
  // such built-in set — every row is one the team explicitly added, so the
  // full list is editable as-is.
  // All DB rows are editable — built-ins were seeded by migration and stay
  // deleted if the team removes them (no auto-reseed).
  const customDtypes = dbDtypes;
  const customMarkets = dbMarkets;

  async function act(fn: () => Promise<void>, msg: string) {
    setBusy(true);
    try { await fn(); await refresh(); toast("Done", msg, "ok"); }
    catch (e) { toast("Failed", e instanceof Error ? e.message : String(e), "bad"); }
    finally { setBusy(false); }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "designers", label: "Designers" },
    { id: "dtypes", label: "Deliverables" },
    { id: "markets", label: "Markets" },
  ];

  return (
    <ModalShell title="Manage Roster">
      <div style={{ display: "flex", borderBottom: "1px solid #E4E7E9", padding: "0 20px" }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "12px 20px", fontSize: 13,
            fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? "#0071E3" : "#5F6365",
            borderBottom: tab === t.id ? "2px solid #0071E3" : "2px solid transparent", marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ padding: "24px 24px 28px" }}>

      {tab === "designers" && (
        <Section items={designers} builtIn={[]} placeholder="Full name e.g. Ravi Kumar" isDesigner
          onAdd={(n) => act(() => addDesignerAction({ name: n }), `${n} added`)}
          onRemove={(n) => act(() => removeDesignerAction(n), `${n} removed`)}
          busy={busy}
        />
      )}
      {tab === "dtypes" && (
        <Section items={customDtypes} builtIn={[]} placeholder="e.g. Packaging Design"
          onAdd={(n) => act(() => addDeliverableTypeAction({ name: n }), `"${n}" added`)}
          onRemove={(n) => act(() => removeDeliverableTypeAction(n), `"${n}" removed`)}
          busy={busy}
        />
      )}
      {tab === "markets" && (
        <Section items={customMarkets} builtIn={[]} placeholder="e.g. UK"
          onAdd={(n) => act(() => addMarketAction({ name: n }), `"${n}" added`)}
          onRemove={(n) => act(() => removeMarketAction(n), `"${n}" removed`)}
          busy={busy}
        />
      )}
      </div>
    </ModalShell>
  );
}
