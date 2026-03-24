export default function AnalysisList({ title, items }) {
  return (
    <div className="analysis-body">
      <div className="analysis-body__title">{title}</div>

      {items.length === 0 ? (
        <div className="analysis-empty">Sin resultados</div>
      ) : (
        <div className="analysis-list">
          {items.map((it, idx) => (
            <div key={it.id ?? idx} className="analysis-card">
              <div className="analysis-card__title">{it.titulo}</div>
              <div className="analysis-card__detail">{it.detalle}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}