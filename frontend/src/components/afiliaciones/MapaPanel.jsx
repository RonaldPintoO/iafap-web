import { useEffect } from "react";
import AfiMap from "../AfiMap.jsx";

export default function MapaPanel({
  mapRef,
  userLoc,
  locStatus,
  locMsg,
  handleLocate,
  mapPoints,
  mapLoading,
  mapError,
  edadMinInput,
  edadMaxInput,
  setEdadMinInput,
  setEdadMaxInput,
  handleApplyEdadFiltro,
  handleClearEdadFiltro,
  edadError,
  tipoPersona,
  setTipoPersona,
}) {
  useEffect(() => {
    if (edadMaxInput !== "" || edadMinInput !== "") {
      handleApplyEdadFiltro();
    }
  }, [edadMaxInput]);

  return (
    <div className="afi-mapa">
      <div className="map-filtros">
        <div className="map-filtros-title">Filtro edad</div>

        <div className="map-filtros-row">
          <input
            type="number"
            min="0"
            value={edadMinInput}
            onChange={(e) => setEdadMinInput(e.target.value)}
            placeholder="Desde"
            className="map-input"
          />

          <span className="map-sep">–</span>

          <input
            type="number"
            min="0"
            value={edadMaxInput}
            onChange={(e) => setEdadMaxInput(e.target.value)}
            placeholder="Hasta"
            className="map-input"
          />

          <button
            type="button"
            onClick={handleClearEdadFiltro}
            className="map-clear"
          >
            Limpiar
          </button>
        </div>

        {edadError && <div className="map-error">{edadError}</div>}

        <div className="map-filtros-title" style={{ marginTop: 10 }}>
          Tipo
        </div>

        <div className="map-tipo-row">
          <button
            type="button"
            className={`map-chip ${tipoPersona === "todos" ? "is-active" : ""}`}
            onClick={() => setTipoPersona("todos")}
          >
            Todos
          </button>

          <button
            type="button"
            className={`map-chip ${tipoPersona === "nacional" ? "is-active" : ""}`}
            onClick={() => setTipoPersona("nacional")}
          >
            Nacional
          </button>

          <button
            type="button"
            className={`map-chip ${tipoPersona === "extranjero" ? "is-active" : ""}`}
            onClick={() => setTipoPersona("extranjero")}
          >
            Extranjero
          </button>
        </div>
      </div>

      <div className="afi-map-box">
        <AfiMap
          onMapReady={(map) => {
            mapRef.current = map;
          }}
          userLocation={userLoc}
          points={mapPoints}
        />

        <button
          className="afi-map-control afi-map-control--top"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleLocate();
          }}
        >
          <span className="material-symbols-outlined">
            {locStatus === "loading" ? "progress_activity" : "my_location"}
          </span>
        </button>

        {locMsg && <div className="afi-map-toast">{locMsg}</div>}
        {mapLoading && <div className="afi-map-toast">Cargando puntos...</div>}
        {mapError && <div className="afi-map-toast">{mapError}</div>}
      </div>
    </div>
  );
}