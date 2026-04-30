import PersonaDetalleHeader from "./PersonaDetalleHeader";
import PersonaDetalleTabs from "./PersonaDetalleTabs";
import DetalleDatos from "./DetalleDatos";
import DetalleVinculos from "./DetalleVinculos";
import DetalleAcciones from "./DetalleAcciones";
import DetalleBps from "./DetalleBps";
import DetalleFormulario from "./DetalleFormulario";
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
    </div>
  );
}
