import ToolbarSelect from "./ToolbarSelect";
import PaginacionPersona from "./PaginacionPersona";
import PersonaCard from "./PersonaCard";
import PersonaDetalle from "./PersonaDetalle";

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
  vinculosPersona,
  vinculosPersonaLoading,
  vinculosPersonaError,
  vinculosInfoModal,
  vinculosInfoModalLoading,
  vinculosInfoModalError,
  onOpenVinculoDelVinculo,
  onOpenFormularioModal,
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
        vinculosPersona={vinculosPersona}
        vinculosPersonaLoading={vinculosPersonaLoading}
        vinculosPersonaError={vinculosPersonaError}
        vinculosInfoModal={vinculosInfoModal}
        vinculosInfoModalLoading={vinculosInfoModalLoading}
        vinculosInfoModalError={vinculosInfoModalError}
        onSelectVinculo={onOpenVinculoDelVinculo}
        onOpenFormularioModal={onOpenFormularioModal}
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

      <PaginacionPersona
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
