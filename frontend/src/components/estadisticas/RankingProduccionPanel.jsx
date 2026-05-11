import { useEffect, useMemo, useState } from "react";

import StatisticsPagination from "./StatisticsPagination";
import {
  ESTADISTICAS_TABS,
  formatNumber,
  getMetricLabel,
  getMetricTotal,
} from "./estadisticas.utils";

const PAGE_SIZE = 20;

function getParticipacion(row, metric, totalMetric) {
  const value = Number(row?.[metric] || 0);
  const total = Number(totalMetric || 0);
  if (!total) return 0;
  return (value / total) * 100;
}

export default function RankingProduccionPanel({ data, loading, error, onReload }) {
  const [metric, setMetric] = useState("total_produccion");
  const [page, setPage] = useState(1);

  const resumen = data?.resumen || {};
  const ranking = data?.ranking || [];
  const totalMetric = getMetricTotal(resumen, metric);

  const rankingOrdenado = useMemo(() => {
    return [...ranking]
      .filter((row) => Number(row?.[metric] || 0) > 0)
      .sort((a, b) => {
        const byMetric = Number(b?.[metric] || 0) - Number(a?.[metric] || 0);
        if (byMetric !== 0) return byMetric;
        return String(a.asesor_nombre || "").localeCompare(String(b.asesor_nombre || ""), "es");
      })
      .map((row, index) => ({
        ...row,
        posicion_metric: index + 1,
        participacion_metric_pct: getParticipacion(row, metric, totalMetric),
      }));
  }, [ranking, metric, totalMetric]);

  const rankingPaginado = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rankingOrdenado.slice(start, start + PAGE_SIZE);
  }, [rankingOrdenado, page]);

  useEffect(() => {
    setPage(1);
  }, [metric, ranking.length]);

  if (loading) {
    return (
      <div className="statistics-body">
        <div className="statistics-loading">Cargando estadísticas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="statistics-body">
        <div className="statistics-error">
          <div>{error}</div>
          <button type="button" onClick={onReload}>Reintentar</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="statistics-body">
        <div className="statistics-empty">Sin datos para el período seleccionado.</div>
      </div>
    );
  }

  return (
    <div className="statistics-body">
      <div className="statistics-body__title">Ranking global de producción</div>

      <section className="statistics-section">
        <div className="statistics-section__header">
          <h3>Ranking por categoría</h3>
          <span>{rankingOrdenado.length} asesor{rankingOrdenado.length === 1 ? "" : "es"}</span>
        </div>

        <div className="statistics-subtabs statistics-subtabs--chips" role="tablist" aria-label="Ranking por tipo">
          {ESTADISTICAS_TABS.map((item) => {
            const active = metric === item.metric;
            const count = getMetricTotal(resumen, item.metric);

            return (
              <button
                key={item.id}
                type="button"
                className={`statistics-subtab ${active ? "is-active" : ""}`}
                onClick={() => setMetric(item.metric)}
              >
                <span>{item.label}</span>
                <strong>{formatNumber(count, 0)}</strong>
              </button>
            );
          })}
        </div>

        {rankingOrdenado.length === 0 ? (
          <div className="statistics-empty">
            No hay producción de {getMetricLabel(metric)} para el período seleccionado.
          </div>
        ) : (
          <>
            <div className="statistics-table-wrap">
              <table className="statistics-table statistics-table--ranking">
                <thead>
                  <tr>
                    <th>Pos.</th>
                    <th>Asesor</th>
                    <th>Cantidad</th>
                    <th>Participación</th>
                    <th className="statistics-table__desktop-only">Total</th>
                    <th className="statistics-table__desktop-only">20.130</th>
                    <th className="statistics-table__desktop-only">16.713</th>
                    <th className="statistics-table__desktop-only">Voluntarias</th>
                    <th className="statistics-table__desktop-only">Traspasos</th>
                    <th className="statistics-table__desktop-only">Firma Art. 8</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingPaginado.map((row) => (
                    <tr key={`${row.asesor}-${metric}`}>
                      <td>{row.posicion_metric}</td>
                      <td>
                        <div className="statistics-advisor">
                          <strong>{row.asesor_nombre}</strong>
                          <span>{row.asesor_numero || row.asesor}</span>
                        </div>
                      </td>
                      <td className="statistics-table__number">{formatNumber(row[metric], 0)}</td>
                      <td className="statistics-table__number">{formatNumber(row.participacion_metric_pct, 2)}%</td>
                      <td className="statistics-table__desktop-only">{formatNumber(row.total_produccion, 0)}</td>
                      <td className="statistics-table__desktop-only">{formatNumber(row.total_20130, 0)}</td>
                      <td className="statistics-table__desktop-only">{formatNumber(row.total_16713, 0)}</td>
                      <td className="statistics-table__desktop-only">{formatNumber(row.total_voluntarias, 0)}</td>
                      <td className="statistics-table__desktop-only">{formatNumber(row.total_traspasos, 0)}</td>
                      <td className="statistics-table__desktop-only">{formatNumber(row.total_firma_art8, 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <StatisticsPagination
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={rankingOrdenado.length}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
}
