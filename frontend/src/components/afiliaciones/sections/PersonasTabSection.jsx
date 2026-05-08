import PersonasPanel from "../personas/PersonasPanel";

export default function PersonasTabSection({ afi }) {
  if (afi.tab !== "personas") return null;

  return (
    <PersonasPanel
      topLocValue={afi.topLocValue}
      setTopLocValue={afi.setTopLocValue}
      topLocalidades={afi.topLocalidades}
      openDropdownId={afi.openDropdownId}
      setOpenDropdownId={afi.setOpenDropdownId}
      handleResetPersonas={afi.handleResetPersonas}
      setShowFilters={afi.setShowFilters}
      setShowAddPersona={afi.setShowAddPersona}
      personasItems={afi.personasItems}
      personasLoading={afi.personasLoading}
      personasRefreshing={afi.personasRefreshing}
      personasError={afi.personasError}
      totalPersonas={afi.personasTotal}
      page={afi.personasPage}
      totalPages={afi.personasTotalPages}
      onPrevPage={afi.handlePrevPersonasPage}
      onNextPage={afi.handleNextPersonasPage}
      onGoToPage={afi.handleGoToPersonasPage}
      personaSeleccionada={afi.personaSeleccionada}
      detalleTab={afi.detalleTab}
      setDetalleTab={afi.setDetalleTab}
      onOpenPersonaDetalle={afi.handleOpenPersonaDetalle}
      onClosePersonaDetalle={afi.handleClosePersonaDetalle}
      accionesPersona={afi.accionesPersona}
      accionesPersonaLoading={afi.accionesPersonaLoading}
      accionesPersonaError={afi.accionesPersonaError}
      onOpenFormularioModal={afi.handleOpenFormularioModal}
      vinculosPersona={afi.vinculosPersona}
      vinculosPersonaLoading={afi.vinculosPersonaLoading}
      vinculosPersonaError={afi.vinculosPersonaError}
      onOpenVinculoDelVinculo={afi.handleOpenVinculoDelVinculo}
      vinculosInfoModal={afi.vinculosInfoModal}
      vinculosInfoModalLoading={afi.vinculosInfoModalLoading}
      vinculosInfoModalError={afi.vinculosInfoModalError}
      showAccionModal={afi.showAccionModal}
      accionesCatalogos={afi.accionesCatalogos}
      accionesCatalogosLoading={afi.accionesCatalogosLoading}
      accionesCatalogosError={afi.accionesCatalogosError}
      accionSaving={afi.accionSaving}
      accionSaveError={afi.accionSaveError}
      accionEditando={afi.accionEditando}
      onOpenNuevaAccion={afi.handleOpenNuevaAccion}
      onOpenEditarAccion={afi.handleOpenEditarAccion}
      onCloseNuevaAccion={afi.handleCloseNuevaAccion}
      onSaveNuevaAccion={afi.handleSaveNuevaAccion}
      onReloadAccionesCatalogos={afi.cargarAccionesCatalogos}
    />
  );
}
