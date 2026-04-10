import { useState, useEffect } from "react";
import ToolbarSelect from "./ToolbarSelect";
import { API_BASE_URL } from "../../config/api";
import DetalleBps from "./DetalleBps";
/* =========================
   HELPERS
========================= */
function cleanValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function hasValue(value) {
  return cleanValue(value) !== "";
}

function onlyDigits(value) {
  return cleanValue(value).replace(/\D+/g, "");
}

function buildBpsDocumentoPayload(item) {
  const esExtranjero = Boolean(item?.tieneDocumentoExtranjero);

  if (esExtranjero) {
    const nroDocumento = cleanValue(item?.documentoExtranjero);
    const paisDocumento = cleanValue(item?.idPaisExtranjero);
    const tipoDocumento = cleanValue(item?.tipoDocumentoExtranjero);

    if (nroDocumento && paisDocumento && tipoDocumento) {
      return {
        nroDocumento,
        paisDocumento,
        tipoDocumento,
      };
    }
  }

  const nroDocumento = onlyDigits(item?.cedula);

  if (!nroDocumento) return null;

  return {
    nroDocumento,
    paisDocumento: "1",
    tipoDocumento: "DO",
  };
}

/* =========================
   CARD (LISTADO)
========================= */
function PersonaCard({ item, onClick }) {
  const nombre = item?.nombreCompleto || "-";
  const departamento = item?.departamento || "-";
  const ciudad = item?.ciudad || "-";

  const edadTexto =
    item?.edad !== null && item?.edad !== undefined && item?.edad !== ""
      ? `Edad: ${item.edad} años`
      : "Edad: s/d";

  const cedulaTexto = item?.cedula ? `CI: ${item.cedula}` : "CI: s/d";

  const chipTexto =
    item?.actividadChipLabel ||
    item?.smsResultadoLabel ||
    item?.resnom ||
    "Consultar";

  const variant =
    item?.actividadChipColor ||
    item?.smsResultadoColor ||
    item?.cardVariant ||
    "consultar";
  const leyendaAfiliacion =
    item?.leyendaAfiliacion || "Posible Afiliación Voluntaria";

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(item);
    }
  };

  return (
    <div
      className={`afi-person-card is-${variant}`}
      onClick={() => onClick?.(item)}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Abrir detalle de ${nombre}`}
    >
      <div className="afi-person-card__accent" />

      <div className="afi-person-card__content">
        <div className="afi-person-card__top">
          <div className="afi-person-card__name">{nombre}</div>

          <div className={`afi-person-card__action-chip is-${variant}`}>
            {chipTexto}
          </div>
        </div>

        <div className="afi-person-card__location">
          {departamento} - {ciudad}
        </div>

        <div className="afi-person-card__extra">
          <span className="afi-person-card__age">{edadTexto}</span>
          <span className="afi-person-card__doc">{cedulaTexto}</span>
        </div>

        <div className="afi-person-card__footer">
          <div className="afi-person-card__meta">
            {item?.fechaUltimaAccionTexto || "Sin Acción"}
          </div>
          <div className={`afi-person-card__affiliation is-${variant}`}>
            {leyendaAfiliacion}
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   PAGINACION
========================= */
function Pagination({ page, totalPages, loading, onPrev, onNext, onGoToPage }) {
  if (!totalPages || totalPages <= 1) return null;

  const maxVisible = 5;
  let start = Math.max(1, page - 2);
  let end = Math.min(totalPages, start + maxVisible - 1);

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  const pages = [];
  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }

  return (
    <div className="afi-pagination">
      <button
        className="afi-pagination__btn"
        type="button"
        onClick={onPrev}
        disabled={loading || page <= 1}
      >
        Anterior
      </button>

      <div className="afi-pagination__pages">
        {start > 1 && (
          <>
            <button
              className={`afi-pagination__page ${page === 1 ? "is-active" : ""}`}
              type="button"
              onClick={() => onGoToPage(1)}
              disabled={loading}
            >
              1
            </button>
            {start > 2 && <span className="afi-pagination__dots">...</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            className={`afi-pagination__page ${page === p ? "is-active" : ""}`}
            type="button"
            onClick={() => onGoToPage(p)}
            disabled={loading}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && (
              <span className="afi-pagination__dots">...</span>
            )}
            <button
              className={`afi-pagination__page ${
                page === totalPages ? "is-active" : ""
              }`}
              type="button"
              onClick={() => onGoToPage(totalPages)}
              disabled={loading}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        className="afi-pagination__btn"
        type="button"
        onClick={onNext}
        disabled={loading || page >= totalPages}
      >
        Siguiente
      </button>
    </div>
  );
}

/* =========================
   DETALLE - HEADER
========================= */

function formatFechaDDMMYYYY(value) {
  if (!value) return "N/D";

  const d = new Date(value);
  if (isNaN(d)) return "N/D";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}/${mm}/${yyyy}`;
}

function PersonaDetalleHeader({ item, onClose }) {
  const nombre = item?.nombreCompleto || "-";
  const cedula = item?.cedula || "s/d";
  const sexo = item?.sexoLabel || "N/D";
  const edad =
    item?.edad !== null && item?.edad !== undefined && item?.edad !== ""
      ? `${item.edad} años`
      : "Edad s/d";

  const fechaNac = formatFechaDDMMYYYY(item?.fechaNac);

  const chipTexto =
    item?.actividadChipTexto || item?.actividadChipLabel || "Consultar";
  const chipColor = item?.actividadChipColor || "Consultar";

  return (
    <div className="afi-detail-hero">
      <div className="afi-detail-hero__top">
        <button
          className="afi-detail-back"
          type="button"
          onClick={onClose}
          aria-label="Volver"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      </div>

      <div className={`afi-detail-hero__chip is-${chipColor}`}>{chipTexto}</div>

      <div className="afi-detail-hero__name">{nombre}</div>

      <div className="afi-detail-hero__sub">
        {sexo} {edad} - {fechaNac}
      </div>

      <div className="afi-detail-hero__doc">Cédula {cedula}</div>
    </div>
  );
}

/* =========================
   DETALLE - TABS
========================= */
function PersonaDetalleTabs({ detalleTab, setDetalleTab }) {
  return (
    <div className="afi-detail-tabs">
      <button
        className={`afi-detail-tab ${detalleTab === "datos" ? "is-active" : ""}`}
        type="button"
        onClick={() => setDetalleTab("datos")}
      >
        Datos
      </button>

      <div className="afi-detail-tab-divider" />

      <button
        className={`afi-detail-tab ${
          detalleTab === "vinculos" ? "is-active" : ""
        }`}
        type="button"
        onClick={() => setDetalleTab("vinculos")}
      >
        Vínculos
      </button>

      <div className="afi-detail-tab-divider" />

      <button
        className={`afi-detail-tab ${
          detalleTab === "acciones" ? "is-active" : ""
        }`}
        type="button"
        onClick={() => setDetalleTab("acciones")}
      >
        Acciones
      </button>
      <div className="afi-detail-tab-divider" />
      <button
        className={`afi-detail-tab ${detalleTab === "bps" ? "is-active" : ""}`}
        type="button"
        onClick={() => setDetalleTab("bps")}
      >
        Bps
      </button>
    </div>
  );
}

/* =========================
   DETALLE - DATOS
========================= */
function DetalleDatos({ item }) {
  const direccionLineas = [
    `Calle: ${cleanValue(item?.calle) || "N/D"}`,
    `Nº: ${cleanValue(item?.nroPuerta) || "N/D"}`,
    hasValue(item?.entre1) || hasValue(item?.entre2)
      ? `Esquinas: ${[cleanValue(item?.entre1), cleanValue(item?.entre2)]
          .filter(Boolean)
          .join(" y ")}`
      : "",
    hasValue(item?.manzana) ? `Manzana: ${cleanValue(item?.manzana)}` : "",
    hasValue(item?.solar) ? `Solar: ${cleanValue(item?.solar)}` : "",
    hasValue(item?.ruta) ? `Ruta: ${cleanValue(item?.ruta)}` : "",
    hasValue(item?.km) ? `Km: ${cleanValue(item?.km)}` : "",
  ].filter(Boolean);

  const direccion =
    direccionLineas.length > 0 ? direccionLineas.join("\n") : "Sin datos";

  /*
  const telefonos = [
    cleanValue(item?.telefono),
    cleanValue(item?.celular),
  ].filter(Boolean);

 const telefonosLlamables = telefonos
    .map((telefono) => ({
      raw: telefono,
      tel: onlyDigits(telefono),
    }))
    .filter((x) => x.raw);*/

  const cedulaSoloDigitos = onlyDigits(item?.cedula);

  const handleLlamar = (telefono) => {
    const tel = onlyDigits(telefono);
    if (!tel) return;
    window.location.href = `tel:${tel}`;
  };

  const handleSoloCi = () => {
    if (!cedulaSoloDigitos) return;
    window.location.href = `/cedula?ci=${encodeURIComponent(cedulaSoloDigitos)}`;
  };

  const handleActividad = () => {
    if (!cedulaSoloDigitos) return;
    window.location.href = `/actividad?ci=${encodeURIComponent(cedulaSoloDigitos)}`;
  };

  return (
    <div className="afi-detail-body">
      <section className="afi-detail-section">
        <h3 className="afi-detail-section__title">Dirección</h3>

        <div className="afi-detail-section__value afi-detail-section__value--multiline">
          {direccion}
        </div>

        <div className="afi-detail-section__actions">
          <button type="button" className="afi-detail-link">
            DIRECCION
          </button>
          <button type="button" className="afi-detail-link">
            UBICACION
          </button>
          <button type="button" className="afi-detail-link">
            EDITAR
          </button>
        </div>
      </section>

      <section className="afi-detail-section">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <h3 className="afi-detail-section__title">Teléfonos</h3>
        </div>

        <div className="afi-detail-phone-list">
          {hasValue(item?.telefono) && (
            <div className="afi-detail-phone-row">
              <div className="afi-detail-phone-number">{item.telefono}</div>
              <button
                type="button"
                className="afi-detail-link"
                onClick={() => handleLlamar(item.telefono)}
              >
                LLAMAR
              </button>
            </div>
          )}

          {hasValue(item?.celular) && (
            <div className="afi-detail-phone-row">
              <div className="afi-detail-phone-number">{item.celular}</div>
              <button
                type="button"
                className="afi-detail-link"
                onClick={() => handleLlamar(item.celular)}
              >
                LLAMAR
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="afi-detail-section">
        <h3 className="afi-detail-section__title">Información</h3>

        <div className="afi-detail-info-grid">
          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Departamento</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.departamento) || "Sin datos"}
            </div>
          </div>

          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Ciudad</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.ciudad) || "Sin datos"}
            </div>
          </div>

          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Tipo</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.asidetalle) || "Sin datos"}
            </div>
          </div>

          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Ley</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.leyLabel) || "Sin datos"}
            </div>
          </div>

          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Estado</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.estadoFiltro) || "Sin datos"}
            </div>
          </div>

          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Tipo afiliación</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.leyendaAfiliacion) || "Sin datos"}
            </div>
          </div>
        </div>
      </section>

      <section className="afi-detail-section">
        <h3 className="afi-detail-section__title">Acciones rápidas</h3>

        <div className="afi-detail-quick-actions">
          <button
            type="button"
            className="afi-detail-link"
            onClick={handleSoloCi}
            disabled={!cedulaSoloDigitos}
          >
            SOLO CI
          </button>

          <button
            type="button"
            className="afi-detail-link"
            onClick={handleActividad}
            disabled={!cedulaSoloDigitos}
          >
            ACTIVIDAD
          </button>

          <button type="button" className="afi-detail-link">
            NO ESTABA
          </button>

          <button type="button" className="afi-detail-link">
            NO ATIENDE
          </button>
        </div>
      </section>
    </div>
  );
}

/* =========================
   DETALLE - VINCULOS
========================= */
function DetalleVinculos() {
  return (
    <div className="afi-detail-body">
      <div className="afi-empty">Próximamente</div>
    </div>
  );
}

/* =========================
   DETALLE - ACCIONES
========================= */
function DetalleAcciones({
  accionesPersona,
  accionesPersonaLoading,
  accionesPersonaError,
}) {
  const handleOpenAdjunto = (accion) => {
    if (!accion?.accnum || !accion?.tieneAdjuntoVisible) return;

    window.open(
      `${API_BASE_URL}/personas/acciones/${encodeURIComponent(accion.accnum)}/adjunto`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  if (accionesPersonaLoading) {
    return (
      <div className="afi-detail-body">
        <div className="afi-empty">Cargando acciones...</div>
      </div>
    );
  }

  if (accionesPersonaError) {
    return (
      <div className="afi-detail-body">
        <div className="afi-empty">{accionesPersonaError}</div>
      </div>
    );
  }

  if (!accionesPersona.length) {
    return (
      <div className="afi-detail-body">
        <div className="afi-empty">Sin acciones para mostrar.</div>
      </div>
    );
  }

  return (
    <div className="afi-detail-body">
      <div className="afi-detail-actions">
        {accionesPersona.map((accion, idx) => {
          const estadoClass =
            accion?.estado === "Finalizado"
              ? "is-finalizado"
              : accion?.estado === "Pendiente"
                ? "is-pendiente"
                : "is-desconocido";

          return (
            <article
              key={`${accion?.accnum || "accion"}-${idx}`}
              className={`afi-action-card ${estadoClass}`}
            >
              <div className="afi-action-card__top">
                <div className="afi-action-card__title">
                  {accion?.resnom || "Sin resultado"}
                </div>
                <div className="afi-action-card__date">
                  {accion?.fechaTexto || "-"}
                </div>
              </div>

              <div className="afi-action-card__state">
                {accion?.estado || "-"}
              </div>

              {Array.isArray(accion?.observacion) &&
              accion.observacion.length > 0 ? (
                <div className="afi-action-card__obs">
                  {accion.observacion.map((item, i) => (
                    <div key={i} className="afi-action-card__obs-line">
                      {item?.label ? (
                        <>
                          <span className="afi-action-card__obs-label">
                            {item.label}:
                          </span>{" "}
                          <span className="afi-action-card__obs-value">
                            {item.value}
                          </span>
                        </>
                      ) : (
                        <span className="afi-action-card__obs-value">
                          {item?.value}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="afi-action-card__footer">
                <div className="afi-action-card__footer-text">
                  Asesor:{" "}
                  {accion?.asesorNombreCompleto || accion?.asenum || "-"}
                </div>

                {accion?.tieneAdjuntoVisible ? (
                  <button
                    type="button"
                    className="afi-detail-link afi-action-card__pdf-btn"
                    onClick={() => handleOpenAdjunto(accion)}
                  >
                    {accion?.adjuntoAccionLabel || "Ver Adjunto"}
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

/* =========================
   DETALLE COMPLETO
========================= */
function PersonaDetalle({
  item,
  detalleTab,
  setDetalleTab,
  onClose,
  accionesPersona,
  accionesPersonaLoading,
  accionesPersonaError,
}) {
  const [telefonosBps, setTelefonosBps] = useState([]);
  const [telefonoBpsLoading, setTelefonoBpsLoading] = useState(false);
  const [telefonoBpsError, setTelefonoBpsError] = useState("");
  const [telefonoBpsConsultado, setTelefonoBpsConsultado] = useState(false);
  const [direccionBps, setDireccionBps] = useState(null);

  useEffect(() => {
    if (detalleTab === "bps" && !telefonoBpsConsultado) {
      handleConsultarTelefonoBps();
    }
  });

  async function handleConsultarTelefonoBps() {
    const payload = buildBpsDocumentoPayload(item);

    if (!payload) {
      setTelefonosBps("");
      setDireccionBps(null);
      setTelefonoBpsError("No hay documento válido para consultar BPS");
      return;
    }

    try {
      setTelefonoBpsLoading(true);

      const response = await fetch(`${API_BASE_URL}/personas/telefono-bps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.detail || "Error BPS");
      }

      setTelefonosBps(data.telefono || "");
      setTelefonosBps(Array.isArray(data.telefonos) ? data.telefonos : []);
      setDireccionBps(data.direccion || null);

      setTelefonoBpsConsultado(true);
    } catch (error) {
      setTelefonoBpsError(error.message);
    } finally {
      setTelefonoBpsLoading(false);
    }
  }
  return (
    <div className="afi-detail">
      <PersonaDetalleHeader item={item} onClose={onClose} />

      <PersonaDetalleTabs
        detalleTab={detalleTab}
        setDetalleTab={setDetalleTab}
      />

      {detalleTab === "datos" && <DetalleDatos item={item} />}
      {detalleTab === "vinculos" && <DetalleVinculos />}
      {detalleTab === "acciones" && (
        <DetalleAcciones
          accionesPersona={accionesPersona}
          accionesPersonaLoading={accionesPersonaLoading}
          accionesPersonaError={accionesPersonaError}
        />
      )}
      {detalleTab === "bps" && (
        <DetalleBps
          telefonosBps={telefonosBps}
          telefonoBpsLoading={telefonoBpsLoading}
          telefonoBpsError={telefonoBpsError}
          telefonoBpsConsultado={telefonoBpsConsultado}
          direccionBps={direccionBps}
          onConsultarTelefonoBps={handleConsultarTelefonoBps}
        />
      )}
    </div>
  );
}

/* =========================
   MAIN
========================= */
export default function PersonasPanel({
  topLocValue,
  setTopLocValue,
  topLocalidades,
  openDropdownId,
  setOpenDropdownId,
  handleResetPersonas,
  setShowFilters,
  setShowAddPersona,
  personasItems,
  personasLoading,
  personasRefreshing,
  personasError,
  totalPersonas,
  page,
  totalPages,
  onPrevPage,
  onNextPage,
  onGoToPage,
  personaSeleccionada,
  detalleTab,
  setDetalleTab,
  onOpenPersonaDetalle,
  onClosePersonaDetalle,
  accionesPersona,
  accionesPersonaLoading,
  accionesPersonaError,
}) {
  if (personaSeleccionada) {
    return (
      <PersonaDetalle
        item={personaSeleccionada}
        detalleTab={detalleTab}
        setDetalleTab={setDetalleTab}
        onClose={onClosePersonaDetalle}
        accionesPersona={accionesPersona}
        accionesPersonaLoading={accionesPersonaLoading}
        accionesPersonaError={accionesPersonaError}
      />
    );
  }

  return (
    <div className="afi-personas">
      <div className="afi-toolbar">
        <ToolbarSelect
          id="topLocalidad"
          value={topLocValue}
          options={topLocalidades}
          openDropdownId={openDropdownId}
          setOpenDropdownId={setOpenDropdownId}
          onChange={(next) => setTopLocValue(next)}
        />

        <button
          className="afi-icon-btn"
          type="button"
          aria-label="Actualizar / limpiar filtros (Personas)"
          onClick={handleResetPersonas}
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

      <div className="afi-count">
        Mostrando {personasItems.length} de {totalPersonas} totales
        {totalPages > 0 ? ` - Página ${page} de ${totalPages}` : ""}
        {personasRefreshing ? " - Actualizando..." : ""}
      </div>

      <div className="afi-list">
        {personasLoading && (
          <div className="afi-empty">Cargando personas...</div>
        )}

        {!personasLoading && personasError && (
          <div className="afi-empty">{personasError}</div>
        )}

        {!personasLoading && !personasError && personasItems.length === 0 && (
          <div className="afi-empty">No hay personas para mostrar.</div>
        )}

        {!personasLoading &&
          !personasError &&
          personasItems.map((item, idx) => (
            <PersonaCard
              key={`${item.cedula || "sin-cedula"}-${idx}`}
              item={item}
              onClick={onOpenPersonaDetalle}
            />
          ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        loading={personasLoading || personasRefreshing}
        onPrev={onPrevPage}
        onNext={onNextPage}
        onGoToPage={onGoToPage}
      />

      <button
        className="afi-fab"
        type="button"
        aria-label="Agregar"
        onClick={() => setShowAddPersona(true)}
      >
        <span className="material-symbols-outlined">add</span>
      </button>
    </div>
  );
}
