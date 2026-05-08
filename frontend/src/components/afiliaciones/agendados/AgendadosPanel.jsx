import { useEffect } from "react";
import PaginacionPersona from "../personas/PaginacionPersona";

function cleanValue(value, fallback = "-") {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function hasValue(value) {
  return cleanValue(value, "") !== "";
}

function parseLocalDate(value) {
  const text = cleanValue(value, "");
  if (!text) return null;
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function toGoogleDate(value) {
  const d = parseLocalDate(value);
  if (!d) return "";
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function addMinutes(value, minutes) {
  const d = parseLocalDate(value);
  if (!d) return "";
  d.setMinutes(d.getMinutes() + minutes);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
}

function buildDireccion(item) {
  return cleanValue(item?.direccion, "Dirección no disponible");
}

function buildCalendarDescription(item) {
  const lines = [
    `Nombre y apellido: ${cleanValue(item?.nombreCompleto)}`,
    `Fecha de nacimiento: ${cleanValue(item?.fechaNacimiento)}`,
    item?.esExtranjero
      ? `Cédula ficticia: ${cleanValue(item?.cedulaFicticia || item?.documento)}`
      : `Documento: ${cleanValue(item?.documento)}`,
    `País: ${cleanValue(item?.pais)}`,
  ];

  if (item?.esExtranjero) {
    lines.push(`Documento extranjero: ${cleanValue(item?.documentoExtranjero)}`);
    lines.push(`Tipo documento: ${cleanValue(item?.tipoDocumentoExtranjero)}`);
  }

  lines.push(`Teléfono: ${cleanValue(item?.telefono)}`);
  lines.push(`Celular: ${cleanValue(item?.celular)}`);
  lines.push(`Dirección: ${buildDireccion(item)}`);
  lines.push(`Resultado: ${cleanValue(item?.resultado)}`);
  lines.push(`Observación: ${cleanValue(item?.observacion)}`);

  return lines.join("\n");
}

function buildGoogleCalendarUrl(item) {
  const start = toGoogleDate(item?.fechaAgendadaIso || item?.fechaAgendada);
  const end = toGoogleDate(addMinutes(item?.fechaAgendadaIso || item?.fechaAgendada, 30));
  const params = new URLSearchParams();
  params.set("action", "TEMPLATE");
  params.set("text", `Contacto afiliación - ${cleanValue(item?.nombreCompleto, "Persona")}`);
  if (start && end) params.set("dates", `${start}/${end}`);
  params.set("details", buildCalendarDescription(item));
  params.set("location", buildDireccion(item));
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildOutlookCalendarUrl(item) {
  const start = item?.fechaAgendadaIso || item?.fechaAgendada || "";
  const end = addMinutes(start, 30);
  const params = new URLSearchParams();
  params.set("path", "/calendar/action/compose");
  params.set("rru", "addevent");
  params.set("subject", `Contacto afiliación - ${cleanValue(item?.nombreCompleto, "Persona")}`);
  if (start) params.set("startdt", start);
  if (end) params.set("enddt", end);
  params.set("body", buildCalendarDescription(item));
  params.set("location", buildDireccion(item));
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function openCalendar(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

function buildEstadoTexto(item) {
  if (item?.cerrado) return "Cerrado";
  if (item?.estadoAgendado === "Vencido") {
    const dias = Number(item?.diasVencido || 0);
    return dias > 1 ? `Vencido hace ${dias} días` : "Vencido desde ayer";
  }
  return cleanValue(item?.estadoAgendado, "Pendiente");
}

function scrollAfiliacionesToTop() {
  requestAnimationFrame(() => {
    const scrollTarget = document.querySelector(".main") || document.scrollingElement;
    scrollTarget?.scrollTo?.({ top: 0, behavior: "smooth" });
  });
}

function AgendadoCard({ item, onOpenPersona, onRegistrarGestion }) {
  const esExtranjero = Boolean(item?.esExtranjero);

  return (
    <article className="afi-ag-card">
      <div className="afi-ag-card__top">
        <div>
          <div className="afi-ag-card__date">{cleanValue(item?.fechaAgendadaTexto)}</div>
          <h3 className="afi-ag-card__title">{cleanValue(item?.nombreCompleto, "Persona")}</h3>
        </div>
        <div className="afi-ag-card__badges">
          <span className="afi-ag-card__badge">{cleanValue(item?.resultado)}</span>
          <span className={`afi-ag-card__status ${item?.cerrado ? "is-closed" : item?.estadoAgendado === "Vencido" ? "is-overdue" : "is-open"}`}>
            {buildEstadoTexto(item)}
          </span>
        </div>
      </div>

      <div className="afi-ag-card__grid">
        <div><strong>{esExtranjero ? "Cédula ficticia" : "Documento"}:</strong> {cleanValue(item?.documento)}</div>
        <div><strong>País:</strong> {cleanValue(item?.pais)}</div>
        <div><strong>Fecha nac.:</strong> {cleanValue(item?.fechaNacimiento)}</div>
        <div><strong>Teléfono:</strong> {cleanValue(item?.telefono, "No tiene")}</div>
        <div><strong>Celular:</strong> {cleanValue(item?.celular, "No tiene")}</div>
        <div><strong>Departamento:</strong> {cleanValue(item?.departamento)}</div>
        <div><strong>Localidad:</strong> {cleanValue(item?.localidad)}</div>
      </div>

      {esExtranjero ? (
        <div className="afi-ag-card__foreign">
          {hasValue(item?.documentoExtranjero) ? (
            <div><strong>Documento extranjero:</strong> {cleanValue(item.documentoExtranjero)}</div>
          ) : null}
          {hasValue(item?.tipoDocumentoExtranjero) ? (
            <div><strong>Tipo documento:</strong> {cleanValue(item.tipoDocumentoExtranjero)}</div>
          ) : null}
        </div>
      ) : null}

      <div className="afi-ag-card__block">
        <strong>Dirección:</strong> {buildDireccion(item)}
      </div>

      {hasValue(item?.observacion) ? (
        <div className="afi-ag-card__block">
          <strong>Observación:</strong> {cleanValue(item.observacion)}
        </div>
      ) : null}

      {item?.cerrado && hasValue(item?.fechaCierre) ? (
        <div className="afi-ag-card__block afi-ag-card__closed-note">
          <strong>Cerrado por gestión posterior:</strong> {cleanValue(item.fechaCierre)}
        </div>
      ) : null}

      <div className="afi-ag-card__actions">
        <button className="afi-ag-card__btn" type="button" onClick={() => onOpenPersona?.(item)}>
          Ver persona
        </button>
        {!item?.cerrado ? (
          <button className="afi-ag-card__btn afi-ag-card__btn--primary" type="button" onClick={() => onRegistrarGestion?.(item)}>
            Registrar gestión
          </button>
        ) : null}
        <button className="afi-ag-card__btn afi-ag-card__btn--google" type="button" onClick={() => openCalendar(buildGoogleCalendarUrl(item))}>
          Google Calendar
        </button>
        <button className="afi-ag-card__btn afi-ag-card__btn--outlook" type="button" onClick={() => openCalendar(buildOutlookCalendarUrl(item))}>
          Outlook
        </button>
      </div>
    </article>
  );
}

export default function AgendadosPanel({
  handleResetAgendados,
  setShowFilters,
  agendadosItems = [],
  totalAgendados = 0,
  page = 1,
  totalPages = 0,
  onPrevPage,
  onNextPage,
  onGoToPage,
  agendadosLoading = false,
  agendadosError = "",
  agendadosRefreshing = false,
  onOpenPersona,
  onRegistrarGestion,
}) {
  useEffect(() => {
    scrollAfiliacionesToTop();
  }, [page]);

  return (
    <div className="afi-agendados">
      <div className="afi-ag-header">
        <div>
          <h2 className="afi-ag-title">Agendados</h2>
          <p className="afi-ag-subtitle">
            Visitas y llamadas agendadas pendientes.
          </p>
        </div>
        {agendadosRefreshing ? <span className="afi-ag-refreshing">Actualizando...</span> : null}
      </div>

      {agendadosLoading ? (
        <div className="afi-ag-empty">Cargando agendados...</div>
      ) : agendadosError ? (
        <div className="afi-ag-empty is-error">{agendadosError}</div>
      ) : agendadosItems.length === 0 ? (
        <div className="afi-ag-empty">No hay agendados para los filtros seleccionados.</div>
      ) : (
        <>
          <div className="afi-count afi-count--agendados">
            Mostrando {agendadosItems.length} de {totalAgendados} agendados
            {totalPages > 0 ? ` · Pág. ${page}/${totalPages}` : ""}
            {agendadosRefreshing ? " · Actualizando..." : ""}
          </div>

          <div className="afi-ag-list">
          {agendadosItems.map((item) => (
            <AgendadoCard
              key={item.accnum || `${item.documento}-${item.fechaAgendada}`}
              item={item}
              onOpenPersona={onOpenPersona}
              onRegistrarGestion={onRegistrarGestion}
            />
          ))}
          </div>

          <PaginacionPersona
            page={page}
            totalPages={totalPages}
            loading={agendadosLoading || agendadosRefreshing}
            onPrev={onPrevPage}
            onNext={onNextPage}
            onGoToPage={onGoToPage}
          />
        </>
      )}

      <div className="afi-ag-actions">
        <button
          className="afi-icon-btn"
          type="button"
          aria-label="Limpiar filtros (Agendados)"
          onClick={handleResetAgendados}
        >
          <span className="material-symbols-outlined">sync</span>
        </button>

        <button
          className="afi-icon-btn"
          type="button"
          aria-label="Filtros"
          onClick={() => setShowFilters(true)}
        >
          <span className="material-symbols-outlined">tune</span>
        </button>
      </div>
    </div>
  );
}
