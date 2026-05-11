import { useEffect, useMemo, useState } from "react";

import AnalysisKpiCard from "./AnalysisKpiCard";
import AnalysisPagination from "./AnalysisPagination";
import { estadoLabel, formatDate, formatNumber, getAsesorDisplayName } from "./analysis.utils";

const PAGE_SIZE = 20;

const ACCIONES_TABS = [
  { id: "Pendiente", label: "Pendientes" },
  { id: "Finalizado", label: "Finalizados" },
];

function DetailList({ title, items, emptyText }) {
  return (
    <section className="analysis-section">
      <div className="analysis-section__header">
        <h3>{title}</h3>
        <span>{items.length} resultado{items.length === 1 ? "" : "s"}</span>
      </div>

      {items.length === 0 ? (
        <div className="analysis-empty">{emptyText || "Sin resultados."}</div>
      ) : (
        <div className="analysis-detail-list">
          {items.map((item) => (
            <div key={`${title}-${item.resultado}`} className="analysis-detail-row">
              <span className="analysis-detail-row__label">{item.resultado}</span>
              <strong className="analysis-detail-row__value">
                {formatNumber(item.cantidad, 0)}
              </strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function estadoMatches(item, estado) {
  return String(item.estado || "").toLowerCase() === estado.toLowerCase();
}

export default function AccionesPanel({ data, loading, error, onReload, asesorNombre }) {
  const [accionesTab, setAccionesTab] = useState("Pendiente");
  const [accionesPage, setAccionesPage] = useState(1);

  const resumen = data?.resumen || {};
  const detalle = data?.detalle || [];
  const tone = Number(resumen.eficiencia || 0) >= 50 ? "good" : "bad";

  const ultimasAccionesFiltradas = useMemo(
    () => detalle.filter((item) => estadoMatches(item, accionesTab)),
    [detalle, accionesTab],
  );

  const ultimasAccionesPaginadas = useMemo(() => {
    const start = (accionesPage - 1) * PAGE_SIZE;
    return ultimasAccionesFiltradas.slice(start, start + PAGE_SIZE);
  }, [ultimasAccionesFiltradas, accionesPage]);

  useEffect(() => {
    setAccionesPage(1);
  }, [accionesTab, detalle.length]);

  if (loading) {
    return (
      <div className="analysis-body">
        <div className="analysis-loading">Cargando análisis de acciones...</div>
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
        Análisis de acciones · {getAsesorDisplayName(data, asesorNombre)}
      </div>

      <div className="analysis-kpis">
        <AnalysisKpiCard label="Documentos trabajados" value={formatNumber(resumen.documentos, 0)} />
        <AnalysisKpiCard label="Acciones realizadas" value={formatNumber(resumen.acciones, 0)} />
        <AnalysisKpiCard label="Finalizados" value={formatNumber(resumen.finalizados, 0)} tone="good" />
        <AnalysisKpiCard label="Pendientes" value={formatNumber(resumen.pendientes, 0)} />
      </div>

      <div className="analysis-kpis analysis-kpis--secondary">
        <AnalysisKpiCard
          label="Eficiencia"
          value={`${formatNumber(resumen.eficiencia, 1)}%`}
          hint="Finalizados / (finalizados + pendientes)"
          tone={tone}
        />
        <AnalysisKpiCard label="Otros" value={formatNumber(resumen.otros, 0)} />
      </div>

      <DetailList
        title="Detalle de finalizados"
        items={data.detalle_finalizados || []}
        emptyText="No hay resultados finalizados en este período."
      />

      <DetailList
        title="Detalle de pendientes"
        items={data.detalle_pendientes || []}
        emptyText="No hay resultados pendientes en este período."
      />

      <section className="analysis-section">
        <div className="analysis-section__header">
          <h3>Últimas acciones del período</h3>
          <span>
            {ultimasAccionesFiltradas.length} registro{ultimasAccionesFiltradas.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="analysis-subtabs" role="tablist" aria-label="Últimas acciones por estado">
          {ACCIONES_TABS.map((item) => {
            const count = detalle.filter((row) => estadoMatches(row, item.id)).length;
            const active = accionesTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`analysis-subtab ${active ? "is-active" : ""}`}
                onClick={() => setAccionesTab(item.id)}
              >
                <span>{item.label}</span>
                <strong>{formatNumber(count, 0)}</strong>
              </button>
            );
          })}
        </div>

        {ultimasAccionesFiltradas.length === 0 ? (
          <div className="analysis-empty">
            No hay acciones {accionesTab === "Pendiente" ? "pendientes" : "finalizadas"} en este período.
          </div>
        ) : (
          <>
            <div className="analysis-table-wrap">
              <table className="analysis-table analysis-table--acciones">
                <thead>
                  <tr>
                    <th>Documento</th>
                    <th>Estado</th>
                    <th>Resultado</th>
                    <th>Acciones</th>
                    <th>Última acción</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimasAccionesPaginadas.map((item) => (
                    <tr key={`${item.documento}-${item.ultima_accion}-${item.estado}`}>
                      <td>{item.documento}</td>
                      <td>{estadoLabel(item.estado)}</td>
                      <td>{item.resultado}</td>
                      <td>{formatNumber(item.acciones, 0)}</td>
                      <td>{formatDate(item.ultima_accion)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AnalysisPagination
              page={accionesPage}
              pageSize={PAGE_SIZE}
              totalItems={ultimasAccionesFiltradas.length}
              onPageChange={setAccionesPage}
            />
          </>
        )}
      </section>
    </div>
  );
}
