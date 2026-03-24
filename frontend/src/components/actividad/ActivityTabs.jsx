export default function ActivityTabs({ tab, setTab }) {
  return (
    <div className="activity-tabs">
      <button
        className={`activity-tab ${tab === "actividad" ? "is-active" : ""}`}
        onClick={() => setTab("actividad")}
      >
        Actividad
      </button>

      <div className="tab-divider" />

      <button
        className={`activity-tab ${tab === "resultado" ? "is-active" : ""}`}
        onClick={() => setTab("resultado")}
      >
        Resultado
      </button>
    </div>
  );
}