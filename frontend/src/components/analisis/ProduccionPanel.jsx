import { useEffect, useMemo, useState } from "react";

import AnalysisKpiCard from "./AnalysisKpiCard";
import AnalysisPagination from "./AnalysisPagination";
import { formatDate, formatNumber, getAsesorDisplayName } from "./analysis.utils";

const PAGE_SIZE = 20;

const PRODUCCION_TABS = [
  { id: "20130", label: "20.130" },
  { id: "16713", label: "16.713" },
  { id: "Voluntarias", label: "Voluntarias" },
  { id: "Traspasos", label: "Traspasos" },
];

function normalizeRegimen(value) {
  const raw = String(value || "").trim();

  if (raw === "20130" || raw === "20.130") return "20130";
  if (raw === "16713" || raw === "16.713") return "16713";
  if (raw.toLowerCase() === "voluntarias") return "Voluntarias";
  if (raw.toLowerCase() === "traspasos") return "Traspasos";

  return raw;
}

function countByRegimen(detalle, regimen) {
  return detalle.filter((item) => normalizeRegimen(item.regimen) === regimen).length;
}

export default function ProduccionPanel({ data, loading, error, onReload, asesorNombre }) {
  const [detalleTab, setDetalleTab] = useState("20130");
  const [detallePage, setDetallePage] = useState(1);

  const resumen = data?.resumen || {};
  const detalle = data?.detalle || [];

  const detalleFiltrado = useMemo(
    () => detalle.filter((item) => normalizeRegimen(item.regimen) === detalleTab),
    [detalle, detalleTab],
  );

  const detallePaginado = useMemo(() => {
    const start = (detallePage - 1) * PAGE_SIZE;
    return detalleFiltrado.slice(start, start + PAGE_SIZE);
  }, [detalleFiltrado, detallePage]);

  useEffect(() => {
    setDetallePage(1);
  }, [detalleTab, detalle.length]);

  if (loading) {
    return (
      <div className="analysis-body">
        <div className="analysis-loading">Cargando producción...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analysis-body">
        <div className="analysis-error">
          <div>{error}</div>
          <button type="button" onClick={onReload}>Reintentar</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="analysis-body">
        <div className="analysis-empty">Sin datos para el período seleccionado.</div>
      </div>
    );
  }

  return (
    <div className="analysis-body">
      <div className="analysis-body__title">
        Producción del período · {getAsesorDisplayName(data, asesorNombre)}
      </div>

      <div className="analysis-kpis analysis-kpis--single">
        <AnalysisKpiCard
          label="Total producción"
          value={formatNumber(resumen.total_produccion, 0)}
          hint="Suma de 20.130, 16.713, voluntarias, traspasos y firma Art. 8"
          tone="good"
        />
      </div>

      <section className="analysis-section">
        <div className="analysis-section__header">
          <h3>Detalle de producción</h3>
          <span>
            {detalleFiltrado.length} registro{detalleFiltrado.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="analysis-subtabs" role="tablist" aria-label="Detalle de producción por tipo">
          {PRODUCCION_TABS.map((item) => {
            const count = countByRegimen(detalle, item.id);
            const active = detalleTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`analysis-subtab ${active ? "is-active" : ""}`}
                onClick={() => setDetalleTab(item.id)}
              >
                <span>{item.label}</span>
                <strong>{formatNumber(count, 0)}</strong>
              </button>
            );
          })}
        </div>

        {detalleFiltrado.length === 0 ? (
          <div className="analysis-empty">
            No hay registros para {PRODUCCION_TABS.find((item) => item.id === detalleTab)?.label} en este período.
          </div>
        ) : (
          <>
            <div className="analysis-table-wrap">
              <table className="analysis-table analysis-table--produccion">
                <thead>
                  <tr>
                    <th>Régimen</th>
                    <th>Mes/Año</th>
                    <th>Documento</th>
                    <th>Fecha movimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {detallePaginado.map((item, index) => (
                    <tr key={`${item.regimen}-${item.documento}-${item.fecha_movimiento}-${detallePage}-${index}`}>
                      <td>{item.regimen}</td>
                      <td>{item.mes_anio}</td>
                      <td>{item.documento}</td>
                      <td>{formatDate(item.fecha_movimiento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AnalysisPagination
              page={detallePage}
              pageSize={PAGE_SIZE}
              totalItems={detalleFiltrado.length}
              onPageChange={setDetallePage}
            />
          </>
        )}
      </section>
    </div>
  );
}
