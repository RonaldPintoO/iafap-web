export default function AfiliacionesTabs({ tab, setTab }) {
  return (
    <div className="afi-tabs">
      <button
        className={`afi-tab ${tab === "personas" ? "is-active" : ""}`}
        onClick={() => setTab("personas")}
        type="button"
      >
        Personas
      </button>

      <div className="afi-tab-divider" />

      <button
        className={`afi-tab ${tab === "mapa" ? "is-active" : ""}`}
        onClick={() => setTab("mapa")}
        type="button"
      >
        Mapa
      </button>

      <div className="afi-tab-divider" />

      <button
        className={`afi-tab ${tab === "agendados" ? "is-active" : ""}`}
        onClick={() => setTab("agendados")}
        type="button"
      >
        Agendados
      </button>
    </div>
  );
}