
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { requirePrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user || (user.role !== "head" && user.role !== "pm")) redirect("/");

  const db = requirePrisma();
  const [projects, events, comments, members, dtypes, markets] = await Promise.all([
    db.project.findMany({ orderBy: { createdAt: "desc" } }),
    db.event.findMany({ orderBy: { at: "desc" }, take: 50 }),
    db.comment.findMany({ orderBy: { at: "desc" }, take: 50 }),
    db.member.findMany({ orderBy: { createdAt: "asc" } }),
    db.deliverableType.findMany({ orderBy: { createdAt: "asc" } }),
    db.market.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const TH = ({ children }: { children: string }) => (
    <th style={{ border: "1px solid #ddd", padding: "6px 12px", background: "#f5f5f5", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>{children}</th>
  );
  const TD = ({ children, muted }: { children: React.ReactNode; muted?: boolean }) => (
    <td style={{ border: "1px solid #ddd", padding: "5px 12px", fontSize: 12, color: muted ? "#999" : undefined }}>{children ?? "—"}</td>
  );

  const Section = ({ title, count }: { title: string; count: number }) => (
    <h2 style={{ fontSize: 14, fontWeight: 700, margin: "32px 0 10px", textTransform: "uppercase", letterSpacing: ".06em", color: "#444" }}>
      {title} <span style={{ fontWeight: 400, color: "#999" }}>({count})</span>
    </h2>
  );

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "32px 40px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Database Viewer</h1>
        <span style={{ fontSize: 12, background: "#EEF4FD", color: "#0071E3", padding: "3px 10px", borderRadius: 20, fontWeight: 600 }}>{user.name} · {user.role}</span>
      </div>

      {/* MEMBERS */}
      <Section title="Designers (Members)" count={members.length} />
      <div style={{ overflowX: "auto", marginBottom: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead><tr><TH>Name</TH><TH>Added by</TH><TH>Created at</TH></tr></thead>
          <tbody>
            {members.length === 0
              ? <tr><TD muted>No members</TD><TD>{""}</TD><TD>{""}</TD></tr>
              : members.map((m) => (
                <tr key={m.id}>
                  <TD>{m.name}</TD>
                  <TD muted>{m.createdBy}</TD>
                  <TD muted>{new Date(m.createdAt).toLocaleString()}</TD>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* DELIVERABLE TYPES */}
      <Section title="Deliverable Types" count={dtypes.length} />
      <div style={{ overflowX: "auto", marginBottom: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead><tr><TH>Name</TH><TH>Added by</TH><TH>Created at</TH></tr></thead>
          <tbody>
            {dtypes.length === 0
              ? <tr><TD muted>No types</TD><TD>{""}</TD><TD>{""}</TD></tr>
              : dtypes.map((d) => (
                <tr key={d.id}>
                  <TD>{d.name}</TD>
                  <TD muted>{d.createdBy}</TD>
                  <TD muted>{new Date(d.createdAt).toLocaleString()}</TD>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* MARKETS */}
      <Section title="Markets" count={markets.length} />
      <div style={{ overflowX: "auto", marginBottom: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead><tr><TH>Name</TH><TH>Added by</TH><TH>Created at</TH></tr></thead>
          <tbody>
            {markets.length === 0
              ? <tr><TD muted>No markets</TD><TD>{""}</TD><TD>{""}</TD></tr>
              : markets.map((m) => (
                <tr key={m.id}>
                  <TD>{m.name}</TD>
                  <TD muted>{m.createdBy}</TD>
                  <TD muted>{new Date(m.createdAt).toLocaleString()}</TD>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* PROJECTS */}
      <Section title="Projects" count={projects.length} />
      <div style={{ overflowX: "auto", marginBottom: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>{["Product", "ASIN", "Deliverable", "Market", "Stage", "Designer", "Priority", "Created at"].map((h) => <TH key={h}>{h}</TH>)}</tr>
          </thead>
          <tbody>
            {projects.length === 0
              ? <tr><TD muted>No projects</TD>{[...Array(7)].map((_, i) => <TD key={i}>{""}</TD>)}</tr>
              : projects.map((p) => (
                <tr key={p.id}>
                  <TD>{p.product}</TD>
                  <TD muted>{p.asin || "—"}</TD>
                  <TD>{p.dtype}</TD>
                  <TD>{p.market}</TD>
                  <TD>{p.stage}</TD>
                  <TD>{p.designer}</TD>
                  <TD muted>{p.priority}</TD>
                  <TD muted>{new Date(p.createdAt).toLocaleString()}</TD>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* EVENTS */}
      <Section title="Recent Events" count={events.length} />
      <div style={{ overflowX: "auto", marginBottom: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>{["Actor", "Role", "Kind", "From", "To", "Note", "At"].map((h) => <TH key={h}>{h}</TH>)}</tr>
          </thead>
          <tbody>
            {events.length === 0
              ? <tr><TD muted>No events</TD>{[...Array(6)].map((_, i) => <TD key={i}>{""}</TD>)}</tr>
              : events.map((e) => (
                <tr key={e.id} style={{ background: e.kind === "create" ? "#f0fdf4" : e.kind === "view" ? "#eff6ff" : "white" }}>
                  <TD>{e.actor}</TD>
                  <TD muted>{e.actorRole}</TD>
                  <TD>{e.kind}</TD>
                  <TD muted>{e.fromStage}</TD>
                  <TD muted>{e.toStage}</TD>
                  <TD muted>{e.note}</TD>
                  <TD muted>{new Date(e.at).toLocaleString()}</TD>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* COMMENTS */}
      <Section title="Recent Comments" count={comments.length} />
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>{["Actor", "Role", "Text", "At"].map((h) => <TH key={h}>{h}</TH>)}</tr>
          </thead>
          <tbody>
            {comments.length === 0
              ? <tr><TD muted>No comments yet</TD><TD>{""}</TD><TD>{""}</TD><TD>{""}</TD></tr>
              : comments.map((c) => (
                <tr key={c.id}>
                  <TD>{c.actor}</TD>
                  <TD muted>{c.actorRole}</TD>
                  <TD>{c.text}</TD>
                  <TD muted>{new Date(c.at).toLocaleString()}</TD>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// export default async function AdminPage() {
//   const db = requirePrisma();
//   const projects = await db.project.findMany({ orderBy: { createdAt: "desc" } });
//   const events = await db.event.findMany({ orderBy: { at: "desc" }, take: 50 });
//   const comments = await db.comment.findMany({ orderBy: { at: "desc" }, take: 50 });

//   const th = "border border-gray-300 px-3 py-2 bg-gray-100 text-left text-xs font-semibold";
//   const td = "border border-gray-300 px-3 py-2 text-xs";

//   return (
//     <div style={{ fontFamily: "monospace", padding: 24 }}>
//       <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>🗄️ Database Viewer</h1>

//       {/* PROJECTS */}
//       <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Projects ({projects.length})</h2>
//       <div style={{ overflowX: "auto", marginBottom: 32 }}>
//         <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
//           <thead>
//             <tr>
//               {["product", "asin", "dtype", "market", "stage", "designer", "priority", "createdAt"].map((h) => (
//                 <th key={h} className={th} style={{ border: "1px solid #ccc", padding: "6px 10px", background: "#f3f4f6", textAlign: "left", fontSize: 11, fontWeight: 600 }}>{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {projects.map((p) => (
//               <tr key={p.id}>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{p.product}</td>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{p.asin}</td>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{p.dtype}</td>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{p.market}</td>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px", fontWeight: 600 }}>{p.stage}</td>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{p.designer}</td>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{p.priority}</td>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px", color: "#666" }}>{new Date(p.createdAt).toLocaleString()}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* EVENTS */}
//       <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Events (last 50)</h2>
//       <div style={{ overflowX: "auto", marginBottom: 32 }}>
//         <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
//           <thead>
//             <tr>
//               {["actor", "actorRole", "kind", "fromStage", "toStage", "note", "at"].map((h) => (
//                 <th key={h} style={{ border: "1px solid #ccc", padding: "6px 10px", background: "#f3f4f6", textAlign: "left", fontSize: 11, fontWeight: 600 }}>{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {events.map((e) => (
//               <tr key={e.id} style={{ background: e.kind === "view" ? "#eff6ff" : e.kind === "create" ? "#f0fdf4" : "white" }}>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{e.actor}</td>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px", color: "#666" }}>{e.actorRole}</td>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px", fontWeight: 600 }}>{e.kind}</td>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px", color: "#666" }}>{e.fromStage ?? "—"}</td>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px", color: "#666" }}>{e.toStage ?? "—"}</td>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px", color: "#666" }}>{e.note ?? "—"}</td>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px", color: "#666" }}>{new Date(e.at).toLocaleString()}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* COMMENTS */}
//       <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>Comments (last 50)</h2>
//       <div style={{ overflowX: "auto" }}>
//         <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12 }}>
//           <thead>
//             <tr>
//               {["actor", "actorRole", "text", "at"].map((h) => (
//                 <th key={h} style={{ border: "1px solid #ccc", padding: "6px 10px", background: "#f3f4f6", textAlign: "left", fontSize: 11, fontWeight: 600 }}>{h}</th>
//               ))}
//             </tr>
//           </thead>
//           <tbody>
//             {comments.length === 0 ? (
//               <tr><td colSpan={4} style={{ border: "1px solid #ccc", padding: "10px", color: "#999", textAlign: "center" }}>No comments yet</td></tr>
//             ) : comments.map((c) => (
//               <tr key={c.id}>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{c.actor}</td>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px", color: "#666" }}>{c.actorRole}</td>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px" }}>{c.text}</td>
//                 <td style={{ border: "1px solid #ccc", padding: "5px 10px", color: "#666" }}>{new Date(c.at).toLocaleString()}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
