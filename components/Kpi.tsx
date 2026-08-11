export default function Kpi({ lb, vl, unit, c, sb }: { lb: string; vl: React.ReactNode; unit?: string; c: string; sb: React.ReactNode }) {
  return (
    <div className="kpi" style={{ "--k": `var(${c})` } as React.CSSProperties}>
      <span className="lb">{lb}</span>
      <span className="vl">
        {vl}
        {unit && <small>{unit}</small>}
      </span>
      <span className="sb">{sb}</span>
    </div>
  );
}
