import PersonaDetalleHeader from "./PersonaDetalleHeader";
import PersonaDetalleTabs from "./PersonaDetalleTabs";
import DetalleDatos from "./DetalleDatos";
import DetalleVinculos from "./DetalleVinculos";
import DetalleAcciones from "./DetalleAcciones";
import DetalleBps from "./DetalleBps";
import DetalleFormulario from "./DetalleFormulario";
import AccionPersonaModal from "./AccionPersonaModal";
import useDetalleBps from "../../hooks/useDetalleBps";
import useDetalleFormulario from "../../hooks/useDetalleFormulario";

export default function PersonaDetalle({
  item,
  detalleTab,
  setDetalleTab,
  onClose,
  accionesPersona,
  accionesPersonaLoading,
  accionesPersonaError,
  vinculosPersona,
  vinculosPersonaLoading,
  vinculosPersonaError,
  onSelectVinculo,
  onOpenFormularioModal,
  vinculosInfoModal = [],
  vinculosInfoModalLoading = false,
  vinculosInfoModalError = "",
  showAccionModal = false,
  accionesCatalogos = { tipos: [], resultados: [] },
  accionesCatalogosLoading = false,
  accionesCatalogosError = "",
  accionSaving = false,
  accionSaveError = "",
  accionEditando = null,
  onOpenNuevaAccion,
  onOpenEditarAccion,
  onCloseNuevaAccion,
  onSaveNuevaAccion,
  onReloadAccionesCatalogos,
}) {
  const bps = useDetalleBps(item, detalleTab);
  const formulario = useDetalleFormulario(item, detalleTab);
  return (
    <div className="afi-detail">
      <PersonaDetalleHeader item={item} onClose={onClose} />

      <PersonaDetalleTabs value={detalleTab} onChange={setDetalleTab} />

      {detalleTab === "datos" && <DetalleDatos item={item} />}
      {detalleTab === "vinculos" && (
        <DetalleVinculos
          vinculos={vinculosPersona}
          loading={vinculosPersonaLoading}
          error={vinculosPersonaError}
          onBuscarVinculosDePersona={onSelectVinculo}
          vinculosInfoModal={vinculosInfoModal}
          vinculosInfoModalLoading={vinculosInfoModalLoading}
          vinculosInfoModalError={vinculosInfoModalError}
        />
      )}
      {detalleTab === "acciones" && (
        <DetalleAcciones
          accionesPersona={accionesPersona}
          accionesPersonaLoading={accionesPersonaLoading}
          accionesPersonaError={accionesPersonaError}
          onOpenNuevaAccion={onOpenNuevaAccion}
          onOpenEditarAccion={onOpenEditarAccion}
        />
      )}
      {detalleTab === "bps" && <DetalleBps {...bps} />}
      {detalleTab === "formulario" && <DetalleFormulario {...formulario} />}
      <button
        type="button"
        className="afi-formulario-fab"
        aria-label="Cargar formulario"
        onClick={() => onOpenFormularioModal?.(item)}
      >
        <span className="material-symbols-outlined">assignment</span>
      </button>

      <AccionPersonaModal
        show={showAccionModal}
        mode={accionEditando ? "edit" : "create"}
        accion={accionEditando}
        item={item}
        catalogos={accionesCatalogos}
        loadingCatalogos={accionesCatalogosLoading}
        errorCatalogos={accionesCatalogosError}
        saving={accionSaving}
        error={accionSaveError}
        onClose={onCloseNuevaAccion}
        onSave={onSaveNuevaAccion}
        onReloadCatalogos={onReloadAccionesCatalogos}
      />
    </div>
  );
}
