import { useMemo, useState } from "react";

import AnalysisTabs from "../components/analisis/AnalysisTabs";
import ProduccionPanel from "../components/analisis/ProduccionPanel";
import AccionesPanel from "../components/analisis/AccionesPanel";
import AutoAlquilerPanel from "../components/analisis/AutoAlquilerPanel";
import { formatDate } from "../components/analisis/analysis.utils";
import { getAuthSession } from "../components/auth/auth.storage";
import useAnalisisProduccion from "../hooks/analisis/useAnalisisProduccion";
import useAnalisisAcciones from "../hooks/analisis/useAnalisisAcciones";
import useAnalisisAutoAlquiler from "../hooks/analisis/useAnalisisAutoAlquiler";

const DEFAULT_FECHA_INICIO = "2026-04-23";
const DEFAULT_FECHA_FIN = "2026-05-13";

export default function Analisis() {
  const [tab, setTab] = useState("produccion");
  const [fechaInicio, setFechaInicio] = useState(DEFAULT_FECHA_INICIO);
  const [fechaFin, setFechaFin] = useState(DEFAULT_FECHA_FIN);
  const [appliedRange, setAppliedRange] = useState({
    fechaInicio: DEFAULT_FECHA_INICIO,
    fechaFin: DEFAULT_FECHA_FIN,
  });

  const asesorNombre = useMemo(() => {
    const session = getAuthSession();
    return String(session?.user?.nombre || "").trim();
  }, []);

  const produccion = useAnalisisProduccion({
    enabled: tab === "produccion",
    fechaInicio: appliedRange.fechaInicio,
    fechaFin: appliedRange.fechaFin,
  });

  const acciones = useAnalisisAcciones({
    enabled: tab === "acciones",
    fechaInicio: appliedRange.fechaInicio,
    fechaFin: appliedRange.fechaFin,
  });

  const autoAlquiler = useAnalisisAutoAlquiler({
    enabled: tab === "autoalquiler",
    fechaInicio: appliedRange.fechaInicio,
    fechaFin: appliedRange.fechaFin,
  });

  const applyRange = () => {
    setAppliedRange({ fechaInicio, fechaFin });
  };

  return (
    <div className="analysis-page">
      <AnalysisTabs tab={tab} setTab={setTab} />

      <div className="analysis-toolbar">
        <div className="analysis-toolbar__group">
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

        <div className="analysis-toolbar__period">
          Período aplicado: {formatDate(appliedRange.fechaInicio)} al {formatDate(appliedRange.fechaFin)}
        </div>
      </div>

      {tab === "produccion" ? (
        <ProduccionPanel
          data={produccion.data}
          loading={produccion.loading}
          error={produccion.error}
          onReload={produccion.reload}
          asesorNombre={asesorNombre}
        />
      ) : null}

      {tab === "acciones" ? (
        <AccionesPanel
          data={acciones.data}
          loading={acciones.loading}
          error={acciones.error}
          onReload={acciones.reload}
          asesorNombre={asesorNombre}
        />
      ) : null}

      {tab === "autoalquiler" ? (
        <AutoAlquilerPanel
          data={autoAlquiler.data}
          loading={autoAlquiler.loading}
          error={autoAlquiler.error}
          onReload={autoAlquiler.reload}
          asesorNombre={asesorNombre}
        />
      ) : null}
    </div>
  );
}
