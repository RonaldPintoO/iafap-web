import { useEffect, useMemo, useState } from "react";

import AnalysisPagination from "./AnalysisPagination";
import { estadoLabel, formatDate, formatNumber } from "./analysis.utils";

const PAGE_SIZE = 20;

function statusClass(estado) {
  return String(estado || "")
    .toLowerCase()
    .replace(/_/g, "_");
}

export default function AutoAlquilerTable({ title, items = [], emptyText }) {
  const [page, setPage] = useState(1);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, page]);

  useEffect(() => {
    setPage(1);
  }, [items.length, title]);

  return (
    <section className="analysis-section">
      <div className="analysis-section__header">
        <h3>{title}</h3>
        <span>{items.length} registro{items.length === 1 ? "" : "s"}</span>
      </div>

      {items.length === 0 ? (
        <div className="analysis-empty">{emptyText || "Sin resultados"}</div>
      ) : (
        <>
          <div className="analysis-table-wrap">
            <table className="analysis-table">
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th>Estado</th>
                  <th>Período</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th>Días</th>
                  <th>Planif.</th>
                  <th>Rendidos</th>
                  <th>Neg./día</th>
                  <th>Rendición</th>
                  <th>Cuenta</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.map((item) => (
                  <tr key={`${item.anio_proyecto}-${item.nro_proyecto}`}>
                    <td>{item.nro_proyecto}</td>
                    <td>
                      <span className={`analysis-status analysis-status--${statusClass(item.estado_autoalquiler)}`}>
                        {estadoLabel(item.estado_autoalquiler)}
                      </span>
                    </td>
                    <td>{item.periodo_texto || "—"}</td>
                    <td>{formatDate(item.fecha_desde)}</td>
                    <td>{formatDate(item.fecha_hasta)}</td>
                    <td>{formatNumber(item.dias, 0)}</td>
                    <td>{formatNumber(item.negocios_planificados, 0)}</td>
                    <td>{item.total_negocios == null ? "—" : formatNumber(item.total_negocios, 0)}</td>
                    <td>{item.negocios_por_dia == null ? "—" : formatNumber(item.negocios_por_dia, 2)}</td>
                    <td>{formatDate(item.fecha_rendicion)}</td>
                    <td>{item.cuenta_corriente == null ? "—" : formatNumber(item.cuenta_corriente, 2)}</td>
                    <td>{item.observaciones || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AnalysisPagination
            page={page}
            pageSize={PAGE_SIZE}
            totalItems={items.length}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}
