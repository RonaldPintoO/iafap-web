export default function StatisticsKpiCard({ label, value, hint, tone = "default" }) {
  return (
    <div className={`statistics-kpi statistics-kpi--${tone}`}>
      <div className="statistics-kpi__label">{label}</div>
      <div className="statistics-kpi__value">{value}</div>
      {hint ? <div className="statistics-kpi__hint">{hint}</div> : null}
    </div>
  );
}
