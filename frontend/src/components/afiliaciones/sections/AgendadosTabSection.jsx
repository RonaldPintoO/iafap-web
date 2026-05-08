import AgendadosPanel from "../agendados/AgendadosPanel";

export default function AgendadosTabSection({ afi }) {
  if (afi.tab !== "agendados") return null;

  return (
    <AgendadosPanel
      handleResetAgendados={afi.handleResetAgendados}
      setShowFilters={afi.setShowFilters}
      agendadosItems={afi.agendadosItems}
      totalAgendados={afi.agendadosTotal}
      page={afi.agendadosPage}
      totalPages={afi.agendadosTotalPages}
      onPrevPage={afi.handlePrevAgendadosPage}
      onNextPage={afi.handleNextAgendadosPage}
      onGoToPage={afi.handleGoToAgendadosPage}
      agendadosLoading={afi.agendadosLoading}
      agendadosRefreshing={afi.agendadosRefreshing}
      agendadosError={afi.agendadosError}
      onOpenPersona={afi.handleOpenPersonaDesdeAgendado}
      onRegistrarGestion={afi.handleRegistrarGestionAgendado}
    />
  );
}
