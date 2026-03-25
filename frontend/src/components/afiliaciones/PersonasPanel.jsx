import ToolbarSelect from "./ToolbarSelect";

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

  const chipTexto = item?.actividadChipLabel || item?.resnom || "Consultar";
  const variant = item?.actividadChipColor || item?.cardVariant || "consultar";
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
function Pagination({
  page,
  totalPages,
  loading,
  onPrev,
  onNext,
  onGoToPage,
}) {
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

  const chipTexto = item?.actividadChipTexto || item?.actividadChipLabel || "Consultar";
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
    </div>
  );
}

/* =========================
   DETALLE - DATOS
========================= */
function DetalleDatos({ item }) {
  const direccionLineas = [
    [cleanValue(item?.calle), cleanValue(item?.nroPuerta)].filter(Boolean).join(" "),
    [cleanValue(item?.ciudad), cleanValue(item?.departamento)]
      .filter(Boolean)
      .join(" - "),
  ].filter(Boolean);

  const direccion =
    direccionLineas.length > 0
      ? direccionLineas.join("\n")
      : cleanValue(item?.direccion) || "Sin dato";

  const telefonos = [
    cleanValue(item?.telefono),
    cleanValue(item?.celular),
  ].filter(Boolean);

  const telefonosLlamables = telefonos
    .map((telefono) => ({
      raw: telefono,
      tel: onlyDigits(telefono),
    }))
    .filter((x) => x.raw);

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
        <h3 className="afi-detail-section__title">Teléfonos</h3>

        <div className="afi-detail-phone-list">
          {telefonosLlamables.length > 0 ? (
            telefonosLlamables.map((telefono, idx) => (
              <div
                key={`${telefono.raw}-${idx}`}
                className="afi-detail-phone-row"
              >
                <div className="afi-detail-phone-number">{telefono.raw}</div>
                <button
                  type="button"
                  className="afi-detail-link"
                  onClick={() => handleLlamar(telefono.raw)}
                >
                  LLAMAR
                </button>
              </div>
            ))
          ) : (
            <div className="afi-detail-phone-row is-empty">
              <div className="afi-detail-phone-number is-empty">Sin dato</div>
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
              {cleanValue(item?.departamento) || "Sin dato"}
            </div>
          </div>

          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Ciudad</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.ciudad) || "Sin dato"}
            </div>
          </div>

          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Tipo</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.asidetalle) || "Sin dato"}
            </div>
          </div>

          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Ley</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.leyLabel) || "Sin dato"}
            </div>
          </div>

          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Estado</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.estadoFiltro) || "Sin dato"}
            </div>
          </div>

          <div className="afi-detail-info-item">
            <div className="afi-detail-info-label">Tipo afiliación</div>
            <div className="afi-detail-info-value">
              {cleanValue(item?.leyendaAfiliacion) || "Sin dato"}
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

              <div className="afi-action-card__state">{accion?.estado || "-"}</div>

              {accion?.observacion ? (
                <div className="afi-action-card__obs">
                  Observación: {accion.observacion}
                </div>
              ) : null}

              <div className="afi-action-card__footer">
                Asesor: {accion?.asesorNombreCompleto || accion?.asenum || "-"}
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
  return (
    <div className="afi-detail">
      <PersonaDetalleHeader item={item} onClose={onClose} />

      <PersonaDetalleTabs detalleTab={detalleTab} setDetalleTab={setDetalleTab} />

      {detalleTab === "datos" && <DetalleDatos item={item} />}
      {detalleTab === "vinculos" && <DetalleVinculos />}
      {detalleTab === "acciones" && (
        <DetalleAcciones
          accionesPersona={accionesPersona}
          accionesPersonaLoading={accionesPersonaLoading}
          accionesPersonaError={accionesPersonaError}
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