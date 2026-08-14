"use client";

import { useState } from "react";
import ModalShell from "./ModalShell";
import { useApp } from "../app-context";
import {
  addDeliverableTypeAction, removeDeliverableTypeAction,
  addMarketAction, removeMarketAction,
} from "@/app/actions/board";
import { createUserAction, deleteUserAction, setUserPasswordAction, updateUserAction } from "@/app/actions/auth";
import { roleLb, type RoleId } from "@/lib/domain";
import type { UserSummary } from "@/lib/data";
import { confirmDelete } from "@/lib/delete-confirmation";

type Tab = "users" | "dtypes" | "markets";
const roles: RoleId[] = ["designer", "lead", "head", "pm", "visitor"];
const roleFilters: { value: RoleId | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "designer", label: "Designers" },
  { value: "lead", label: "Team Leads" },
  { value: "head", label: "Team Heads" },
  { value: "pm", label: "Project Managers" },
  { value: "visitor", label: "Visitors" },
];

function Section({
  items, builtIn, placeholder, onAdd, onRemove, busy,
}: {
  items: string[]; builtIn: string[]; placeholder: string;
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
                paddingLeft: 14,
                paddingRight: 10,
                borderRadius: 999, background: "#EEF4FF", border: "1px solid #C5D8F8",
                fontSize: 13, fontWeight: 500, color: "#1A1D1F",
              }}>
                <span>{item}</span>
                <button onClick={async () => {
                  if (await confirmDelete(`"${item}" will be removed. You won't be able to revert this!`)) await onRemove(item);
                }} disabled={busy} style={{
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

function UserEditor({ item, busy, act }: {
  item: UserSummary;
  busy: boolean;
  act: (fn: () => Promise<void>, message: string) => Promise<void>;
}) {
  const [name, setName] = useState(item.name);
  const [username, setUsername] = useState(item.username);
  const [email, setEmail] = useState(item.email ?? "");
  const [role, setRole] = useState<RoleId>(item.role);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <article className="user-editor">
      <header className="user-editor-head">
        <div>
          <strong>{item.name}</strong>
          <span>{roleLb(item.role)} · @{item.username}</span>
        </div>
        <div className="user-editor-actions">
          <button className="btn" disabled={busy} onClick={() => act(
            () => updateUserAction({ id: item.id, name, username, email, role }),
            `${name} updated`,
          )}>Save profile</button>
          <button className="btn gh" disabled={busy} onClick={async () => {
            if (await confirmDelete(`${item.name} will no longer be able to sign in.`)) {
              await act(() => deleteUserAction(item.id), `${item.name} deleted`);
            }
          }}>Delete</button>
        </div>
      </header>
      <span className="user-section-label">Profile details</span>
      <div className="user-fields">
        <input aria-label="Full name" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} />
        <input aria-label="Username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={busy} />
        <input aria-label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} placeholder="Email (optional)" />
        <select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value as RoleId)} disabled={busy}>
          {roles.map((value) => <option key={value} value={value}>{roleLb(value)}</option>)}
        </select>
      </div>
      <div className="user-editor-divider" />
      <span className="user-section-label">Password access</span>
      <div className="user-password-row">
        <input
          aria-label={`New password for ${item.name}`}
          autoComplete="new-password"
          disabled={busy}
          minLength={10}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={item.hasPassword ? "New password" : "Set initial password"}
          type="password"
          value={password}
        />
        <input
          aria-label={`Confirm new password for ${item.name}`}
          autoComplete="new-password"
          disabled={busy}
          minLength={10}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
          type="password"
          value={confirmPassword}
        />
        <button className="btn" disabled={busy || password.length < 10 || password !== confirmPassword} onClick={async () => {
          await act(() => setUserPasswordAction({ id: item.id, password, confirmPassword }), `Password updated for ${name}`);
          setPassword("");
          setConfirmPassword("");
        }}>{item.hasPassword ? "Reset password" : "Set password"}</button>
      </div>
      {confirmPassword && password !== confirmPassword && (
        <p className="signin-error" role="alert">Passwords do not match.</p>
      )}
    </article>
  );
}

function UsersSection({ users, busy, act }: {
  users: UserSummary[];
  busy: boolean;
  act: (fn: () => Promise<void>, message: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleId>("designer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleId | "all">("all");
  const filteredUsers = roleFilter === "all" ? users : users.filter((item) => item.role === roleFilter);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) return;
    const createdRole = role;
    await act(() => createUserAction({ name, username, email, role, password, confirmPassword }), `${name} created`);
    setName(""); setUsername(""); setEmail(""); setRole("designer"); setPassword(""); setConfirmPassword("");
    setRoleFilter(createdRole);
  }

  return (
    <div className="users-section">
      <form className="create-user-panel" onSubmit={create}>
        <div>
          <h4>Add user</h4>
          <p>Create an account and assign its board role.</p>
        </div>
        <div className="user-fields">
          <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" disabled={busy} />
          <input required minLength={3} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" disabled={busy} autoCapitalize="none" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" disabled={busy} />
          <select value={role} onChange={(e) => setRole(e.target.value as RoleId)} disabled={busy}>
            {roles.map((value) => <option key={value} value={value}>{roleLb(value)}</option>)}
          </select>
        </div>
        <div className="create-user-passwords">
          <input required minLength={10} maxLength={128} autoComplete="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Initial password (10+ characters)" disabled={busy} style={{ flex: 1 }} />
          <input required minLength={10} maxLength={128} autoComplete="new-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" disabled={busy} style={{ flex: 1 }} />
        </div>
        {confirmPassword && password !== confirmPassword && (
          <p className="signin-error" role="alert">Passwords do not match.</p>
        )}
        <div className="user-profile-actions">
          <button className="btn pri" disabled={busy || password.length < 10 || password !== confirmPassword} type="submit">Create user</button>
        </div>
      </form>
      <div className="user-list-toolbar">
        <div>
          <h4>Accounts</h4>
          <p>{filteredUsers.length} of {users.length} users</p>
        </div>
        <div className="user-role-filters" aria-label="Filter accounts by role" role="group">
          {roleFilters.map((filter) => {
            const count = filter.value === "all" ? users.length : users.filter((item) => item.role === filter.value).length;
            return (
              <button
                aria-pressed={roleFilter === filter.value}
                className={roleFilter === filter.value ? "active" : ""}
                key={filter.value}
                onClick={() => setRoleFilter(filter.value)}
                type="button"
              >
                {filter.label} <span>{count}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="user-list">
        {filteredUsers.map((item) => <UserEditor key={item.id} item={item} busy={busy} act={act} />)}
        {filteredUsers.length === 0 && (
          <div className="user-list-empty">No users in this role yet.</div>
        )}
      </div>
    </div>
  );
}

export default function ManageRosterModal() {
  const { user, users, dbDtypes, dbMarkets, toast, refresh } = useApp();
  const canManageUsers = user.role === "head" || user.role === "pm";
  const [tab, setTab] = useState<Tab>(canManageUsers ? "users" : "dtypes");
  const [busy, setBusy] = useState(false);

  const customDtypes = dbDtypes;
  const customMarkets = dbMarkets;

  async function act(fn: () => Promise<void>, msg: string) {
    setBusy(true);
    try { await fn(); await refresh(); toast("Done", msg, "ok"); }
    catch (e) { toast("Failed", e instanceof Error ? e.message : String(e), "bad"); }
    finally { setBusy(false); }
  }

  const tabs: { id: Tab; label: string }[] = [
    ...(canManageUsers ? [{ id: "users" as const, label: "Users" }] : []),
    { id: "dtypes", label: "Deliverables" },
    { id: "markets", label: "Markets" },
  ];

  return (
    <ModalShell title="Manage Roster" wide>
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

      {tab === "users" && canManageUsers && <UsersSection users={users} busy={busy} act={act} />}
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
