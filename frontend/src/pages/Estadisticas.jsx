import { useState } from "react";

import RankingProduccionPanel from "../components/estadisticas/RankingProduccionPanel";
import { formatDate } from "../components/estadisticas/estadisticas.utils";
import useRankingProduccion from "../hooks/estadisticas/useRankingProduccion";
import "../styles/estadisticas.css";

const DEFAULT_FECHA_INICIO = "2026-04-23";
const DEFAULT_FECHA_FIN = "2026-05-13";

export default function Estadisticas() {
  const [fechaInicio, setFechaInicio] = useState(DEFAULT_FECHA_INICIO);
  const [fechaFin, setFechaFin] = useState(DEFAULT_FECHA_FIN);
  const [appliedRange, setAppliedRange] = useState({
    fechaInicio: DEFAULT_FECHA_INICIO,
    fechaFin: DEFAULT_FECHA_FIN,
  });

  const rankingProduccion = useRankingProduccion({
    fechaInicio: appliedRange.fechaInicio,
    fechaFin: appliedRange.fechaFin,
  });

  const applyRange = () => {
    setAppliedRange({ fechaInicio, fechaFin });
  };

  return (
    <div className="statistics-page">
      <div className="statistics-header">
        <div>
          <div className="statistics-header__eyebrow">Estadísticas</div>
          <h1>Ranking de producción</h1>
          <p>Totales por tipo de Afiliaciones.</p>
        </div>
      </div>

      <div className="statistics-toolbar">
        <div className="statistics-toolbar__group">
          <label>
            <span>Desde</span>
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </label>

          <label>
            <span>Hasta</span>
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </label>

          <button type="button" onClick={applyRange}>Aplicar</button>
        </div>

        <div className="statistics-toolbar__period">
          Período aplicado: {formatDate(appliedRange.fechaInicio)} al {formatDate(appliedRange.fechaFin)}
        </div>
      </div>

      <RankingProduccionPanel
        data={rankingProduccion.data}
        loading={rankingProduccion.loading}
        error={rankingProduccion.error}
        onReload={rankingProduccion.reload}
      />
    </div>
  );
}
