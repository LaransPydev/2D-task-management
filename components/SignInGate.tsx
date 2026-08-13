import { signInAction } from "@/app/actions/auth";
import { ROLES, peopleIn, initials, avColor, type RoleId } from "@/lib/domain";

const GRP: [RoleId, string][] = [
  ["designer", "Designers"],
  ["lead", "Team Leads"],
  ["head", "Team Heads"],
  ["pm", "Project Manager"],
  ["visitor", "Or just look around"],
];

function Avatar({ name }: { name: string }) {
  return (
    <i className="av" style={{ background: avColor(name) }} title={name}>
      {initials(name)}
    </i>
  );
}

export function PeoplePicker({ currentName, extraDesigners = [] }: { currentName?: string; extraDesigners?: string[] }) {
  return (
    <>
      {GRP.map(([r, lb]) => {
        const desc = ROLES.find((x) => x.id === r)?.d || "";
        // Designers are the one role with no fixed roster entry — every name
        // here is one the team explicitly added via Manage Roster (see
        // lib/data.ts, ensureBuiltIns/cleanupSeededDesigners). Team Lead/
        // Head/PM/Visitor stay on the fixed ROSTER: those roles gate real
        // approvals, and there's currently no way to add one through the UI.
        const people = r === "designer" ? extraDesigners : peopleIn(r);
        return (
          <div className="rgroup" key={r}>
            <div className="rgroup-h">
              <b>{lb}</b>
              <span className="rule" />
              <em>{desc}</em>
            </div>
            <div className="people">
              {people.map((n) => (
                <form action={signInAction} key={n}>
                  <input type="hidden" name="name" value={n} />
                  <button type="submit" className={"person" + (currentName === n ? " on" : "")}>
                    <Avatar name={n} />
                    <b>{n}</b>
                  </button>
                </form>
              ))}
              {r === "designer" && people.length === 0 && (
                <p style={{ fontSize: 12, color: "var(--tx-3)", margin: 0 }}>
                  No designers added yet — a Team Lead, Team Head, or Project Manager can add one from ⚙ Manage.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function SignInGate({ designers = [] }: { designers?: string[] }) {
  return (
    <div className="gate">
      <div className="gate-box">
        <div className="gate-mark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.sportstech.de/cdn/shop/files/logo__4_59d2ab76-f9f0-4f4f-804d-618913cd4325.svg?v=1775131600&width=212"
            alt="Sportstech"
            style={{ height: 28, width: "auto" }}
          />
        </div>
        <h1>
          Sign in as <em>yourself</em>.
        </h1>
        <p className="sub">
          Pick your name — your role comes with it. There is no name box and no role picker, so nobody can award
          themselves an approval they do not hold. A designer cannot pass the Team Lead&apos;s gate, and a Team Lead
          cannot pass the Team Head&apos;s. The Team Head and the Project Manager override everything. Anyone who
          only needs to look can enter as a <b>Visitor</b> — every project, log and chart is visible, and nothing
          can be touched.
        </p>
        <div className="gate-card">
          <PeoplePicker extraDesigners={designers} />
        </div>
      </div>
    </div>
  );
}
