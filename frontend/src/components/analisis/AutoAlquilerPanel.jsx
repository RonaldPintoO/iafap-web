import AnalysisKpiCard from "./AnalysisKpiCard";
import AutoAlquilerTable from "./AutoAlquilerTable";
import { formatNumber, normalizeAnalisisPayload, getAsesorDisplayName } from "./analysis.utils";

export default function AutoAlquilerPanel({ data, loading, error, onReload, asesorNombre }) {
  const payload = normalizeAnalisisPayload(data);

  if (loading) {
    return (
      <div className="analysis-body">
        <div className="analysis-loading">Cargando análisis de Auto/Alquiler...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analysis-body">
        <div className="analysis-error">
          <div>{error}</div>
          <button type="button" onClick={onReload}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!payload || !payload.resumen) {
    return (
      <div className="analysis-body">
        <div className="analysis-empty">Sin datos para el período seleccionado.</div>
      </div>
    );
  }

  const resumen = payload.resumen || {};
  const diferencia = Number(resumen.diferencia_vs_meta || 0);
  const diferenciaTone = diferencia >= 0 ? "good" : "bad";

  return (
    <div className="analysis-body">
      <div className="analysis-body__title">
        Auto/Alquiler · {getAsesorDisplayName(payload, asesorNombre)}
      </div>

      <div className="analysis-kpis">
        <AnalysisKpiCard
          label="Proyectos rendidos"
          value={formatNumber(resumen.proyectos_rendidos, 0)}
          hint="Con total de negocios cargado"
        />

        <AnalysisKpiCard
          label="Negocios rendidos"
          value={formatNumber(resumen.total_negocios_rendidos, 0)}
          hint={`${formatNumber(resumen.total_dias_rendidos, 0)} días rendidos`}
        />

        <AnalysisKpiCard
          label="Promedio negocios/día"
          value={formatNumber(resumen.promedio_negocios_dia, 2)}
          hint={`Meta: ${formatNumber(resumen.meta_negocios_dia, 0)} por día`}
          tone={diferenciaTone}
        />

        <AnalysisKpiCard
          label="Diferencia vs meta"
          value={`${diferencia >= 0 ? "+" : ""}${formatNumber(diferencia, 2)}`}
          hint="Negocios por día"
          tone={diferenciaTone}
        />
      </div>

      <div className="analysis-kpis analysis-kpis--secondary">
        <AnalysisKpiCard
          label="No rendidos / abiertos"
          value={formatNumber(resumen.proyectos_no_rendidos, 0)}
          hint="No impactan el promedio"
        />

        <AnalysisKpiCard
          label="En curso"
          value={formatNumber(resumen.proyectos_en_curso, 0)}
        />

        <AnalysisKpiCard
          label="Pendientes"
          value={formatNumber(resumen.proyectos_pendientes, 0)}
        />

        <AnalysisKpiCard
          label="Para descontar"
          value={formatNumber(resumen.proyectos_descontar, 0)}
        />
      </div>

      <AutoAlquilerTable
        title="Proyectos rendidos"
        items={payload.rendidos || []}
        emptyText="No hay proyectos rendidos en este período."
      />

      <AutoAlquilerTable
        title="Proyectos no rendidos / abiertos"
        items={payload.no_rendidos || []}
        emptyText="No hay proyectos abiertos, futuros o pendientes."
      />
    </div>
  );
}
