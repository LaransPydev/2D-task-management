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

export function PeoplePicker({ currentName }: { currentName?: string }) {
  return (
    <>
      {GRP.map(([r, lb]) => {
        const desc = ROLES.find((x) => x.id === r)?.d || "";
        const people = peopleIn(r);
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
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function SignInGate() {
  return (
    <div className="gate">
      <div className="gate-box">
        <div className="gate-mark">
          <div className="brand-mark" />
          <div>
            <b>Sportstech</b>
            <span>Creative Ops · Amazon Pipeline</span>
          </div>
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
          <PeoplePicker />
        </div>
      </div>
    </div>
  );
}
