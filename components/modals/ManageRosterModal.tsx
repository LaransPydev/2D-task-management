"use client";

import { useState } from "react";
import ModalShell from "./ModalShell";
import { useApp } from "../app-context";
import {
  addDesignerAction, removeDesignerAction,
  addDeliverableTypeAction, removeDeliverableTypeAction,
  addMarketAction, removeMarketAction,
} from "@/app/actions/board";
import { DTYPES, MARKETS, peopleIn, initials, avColor } from "@/lib/domain";

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
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <form onSubmit={submit} style={{ display: "flex", gap: 8 }}>
        <input
          value={val} onChange={(e) => setVal(e.target.value)}
          placeholder={placeholder} disabled={busy} autoFocus
          style={{ flex: 1, padding: "8px 12px", border: "1px solid #E4E7E9", borderRadius: 8, fontSize: 13 }}
        />
        <button type="submit" className="btn pri" disabled={busy || !val.trim()}>+ Add</button>
      </form>

      {items.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#5F6365", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>Added</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {items.map((item) => (
              <div key={item} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: isDesigner ? "5px 10px 5px 8px" : "5px 10px", borderRadius: 20, background: "#EEF4FD", border: "1px solid #C8DCF8", fontSize: 12, fontWeight: 500 }}>
                {isDesigner && (
                  <i style={{ width: 22, height: 22, borderRadius: "50%", background: avColor(item), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontStyle: "normal", fontWeight: 700, flexShrink: 0 }}>
                    {initials(item)}
                  </i>
                )}
                <span>{item}</span>
                <button onClick={() => onRemove(item)} disabled={busy} style={{ background: "none", border: "none", cursor: "pointer", color: "#8E9294", fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#8E9294", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 10 }}>Built-in (cannot remove)</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {builtIn.map((item) => (
            <div key={item} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: isDesigner ? "5px 10px 5px 8px" : "5px 10px", borderRadius: 20, background: "#FAFBFB", border: "1px solid #E4E7E9", fontSize: 12, color: "#8E9294" }}>
              {isDesigner && (
                <i style={{ width: 22, height: 22, borderRadius: "50%", background: avColor(item), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#fff", fontStyle: "normal", fontWeight: 700, flexShrink: 0, opacity: 0.5 }}>
                  {initials(item)}
                </i>
              )}
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ManageRosterModal() {
  const { designers, dbDtypes, dbMarkets, toast, refresh } = useApp();
  const [tab, setTab] = useState<Tab>("designers");
  const [busy, setBusy] = useState(false);

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
      <div style={{ display: "flex", marginBottom: 24, borderBottom: "1px solid #E4E7E9", paddingLeft: 4 }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "10px 20px", fontSize: 13,
            fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? "#0071E3" : "#5F6365",
            borderBottom: tab === t.id ? "2px solid #0071E3" : "2px solid transparent", marginBottom: -1,
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ padding: "0 4px" }}>

      {tab === "designers" && (
        <Section items={designers} builtIn={peopleIn("designer")} placeholder="Full name e.g. Ravi Kumar" isDesigner
          onAdd={(n) => act(() => addDesignerAction({ name: n }), `${n} added`)}
          onRemove={(n) => act(() => removeDesignerAction(n), `${n} removed`)}
          busy={busy}
        />
      )}
      {tab === "dtypes" && (
        <Section items={dbDtypes} builtIn={DTYPES} placeholder="e.g. Packaging Design"
          onAdd={(n) => act(() => addDeliverableTypeAction({ name: n }), `"${n}" added`)}
          onRemove={(n) => act(() => removeDeliverableTypeAction(n), `"${n}" removed`)}
          busy={busy}
        />
      )}
      {tab === "markets" && (
        <Section items={dbMarkets} builtIn={MARKETS} placeholder="e.g. UK"
          onAdd={(n) => act(() => addMarketAction({ name: n }), `"${n}" added`)}
          onRemove={(n) => act(() => removeMarketAction(n), `"${n}" removed`)}
          busy={busy}
        />
      )}
      </div>
    </ModalShell>
  );
}
