export default function AnalysisKpiCard({ label, value, hint, tone = "default" }) {
  return (
    <div className={`analysis-kpi analysis-kpi--${tone}`}>
      <div className="analysis-kpi__label">{label}</div>
      <div className="analysis-kpi__value">{value}</div>
      {hint ? <div className="analysis-kpi__hint">{hint}</div> : null}
    </div>
  );
}
