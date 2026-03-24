export default function AgendadosPanel({
  handleResetAgendados,
  setShowFilters,
}) {
  return (
    <div className="afi-agendados">
      <div className="afi-ag-empty">
        (Agendados pendiente — acá mostramos visita/llamada agendada)
      </div>

      <div className="afi-ag-actions">
        <button
          className="afi-icon-btn"
          type="button"
          aria-label="Limpiar filtros (Agendados)"
          onClick={handleResetAgendados}
        >
          <span className="material-symbols-outlined">sync</span>
        </button>

        <button
          className="afi-icon-btn"
          type="button"
          aria-label="Filtros"
          onClick={() => setShowFilters(true)}
        >
          <span className="material-symbols-outlined">tune</span>
        </button>
      </div>
    </div>
  );
}