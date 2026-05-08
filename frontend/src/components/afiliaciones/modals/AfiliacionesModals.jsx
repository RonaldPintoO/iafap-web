import FiltrosModal from "./FiltrosModal";
import AddPersonaModal from "./AddPersonaModal";
import FormularioCargaModal from "../../formularios/FormularioCargaModal";

export default function AfiliacionesModals({ afi }) {
  return (
    <>
      <FiltrosModal
        showFilters={afi.showFilters}
        setShowFilters={afi.setShowFilters}
        tab={afi.tab}
        personasValues={afi.personasDraftValues}
        setPersonasValues={afi.setPersonasDraftValues}
        agendadosValues={afi.agendadosValues}
        setAgendadosValues={afi.setAgendadosValues}
        openDropdownId={afi.openDropdownId}
        setOpenDropdownId={afi.setOpenDropdownId}
        personasFilterCatalogs={afi.personasFilterCatalogs}
        agendadosDepartamentoOptions={afi.agendadosDepartamentoOptions}
        agendadosLocalidadOptions={afi.agendadosLocalidadOptions}
        agendadosLocalidadesLoading={afi.agendadosLocalidadesLoading}
        onAcceptPersonas={afi.handleAcceptPersonasFilters}
        personasFiltrosError={afi.personasFiltrosError}
      />

      <AddPersonaModal
        show={afi.showAddPersona}
        closeAddPersona={afi.closeAddPersona}
        personaForm={afi.personaForm}
        setPersonaField={afi.setPersonaField}
        digitsOnly={afi.digitsOnly}
        ciOk={afi.ciOk}
        telOk={afi.telOk}
        canSubmit={afi.canSubmit}
        onSubmitPersona={afi.onSubmitPersona}
      />

      <FormularioCargaModal
        show={afi.showFormularioModal}
        closeAdd={afi.closeFormularioModal}
        addTab={afi.formularioTab}
        setAddTab={afi.setFormularioTab}
        datos={afi.formularioDatos}
        setDatos={afi.setFormularioDatos}
        paisOptions={afi.formPaisOptions}
        departamentoOptions={afi.formDepartamentoOptions}
        localidadOptions={afi.formLocalidadOptions}
        proyectoOptions={afi.formProyectoOptions}
        formularioOptions={afi.formFormularioOptions}
        onFormularioChange={afi.handleFormularioPendienteChange}
        loadingCatalogos={afi.formCatalogosLoading}
        errorCatalogos={afi.formCatalogosError}
        saving={afi.formularioSaving}
        onSubmit={afi.handleSubmitFormulario}
      />
    </>
  );
}
