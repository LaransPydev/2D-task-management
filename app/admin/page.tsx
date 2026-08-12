import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { requirePrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user || (user.role !== "head" && user.role !== "pm")) redirect("/");

  const db = requirePrisma();
  const projects = await db.project.findMany({ orderBy: { createdAt: "desc" } });
  const events = await db.event.findMany({ orderBy: { at: "desc" }, take: 50 });
  const comments = await db.comment.findMany({ orderBy: { at: "desc" }, take: 50 });

  const th = "border border-gray-300 px-3 py-2 bg-gray-100 text-left text-xs font-semibold";
  const td = "border border-gray-300 px-3 py-2 text-xs";

  return (
    <div style={{ fontFamily: "monospace", padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>🗄️ Database Viewer</h1>

      {/* PROJECTS */}
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Projects ({projects.length})</h2>
      <div style={{ overflowX: "auto", marginBottom: 32 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
          <thead>
            <tr>
              {["product", "asin", "dtype", "market", "stage", "designer", "priority", "createdAt"].map((h) => (
                <th key={h} className={th} style={{ border: "1px solid #ccc", padding: "6px 10px", background: "#f3f4f6", textAlign: "left", fontSize: 11, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id}>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{p.product}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{p.asin}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{p.dtype}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{p.market}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px", fontWeight: 600 }}>{p.stage}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{p.designer}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{p.priority}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px", color: "#666" }}>{new Date(p.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* EVENTS */}
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Events (last 50)</h2>
      <div style={{ overflowX: "auto", marginBottom: 32 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
          <thead>
            <tr>
              {["actor", "actorRole", "kind", "fromStage", "toStage", "note", "at"].map((h) => (
                <th key={h} style={{ border: "1px solid #ccc", padding: "6px 10px", background: "#f3f4f6", textAlign: "left", fontSize: 11, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} style={{ background: e.kind === "view" ? "#eff6ff" : e.kind === "create" ? "#f0fdf4" : "white" }}>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{e.actor}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px", color: "#666" }}>{e.actorRole}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px", fontWeight: 600 }}>{e.kind}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px", color: "#666" }}>{e.fromStage ?? "—"}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px", color: "#666" }}>{e.toStage ?? "—"}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px", color: "#666" }}>{e.note ?? "—"}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px", color: "#666" }}>{new Date(e.at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* COMMENTS */}
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Comments (last 50)</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
          <thead>
            <tr>
              {["actor", "actorRole", "text", "at"].map((h) => (
                <th key={h} style={{ border: "1px solid #ccc", padding: "6px 10px", background: "#f3f4f6", textAlign: "left", fontSize: 11, fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comments.length === 0 ? (
              <tr><td colSpan={4} style={{ border: "1px solid #ccc", padding: "10px", color: "#999", textAlign: "center" }}>No comments yet</td></tr>
            ) : comments.map((c) => (
              <tr key={c.id}>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{c.actor}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px", color: "#666" }}>{c.actorRole}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{c.text}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 10px", color: "#666" }}>{new Date(c.at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
