import AfiliacionesTabs from "../components/afiliaciones/shared/AfiliacionesTabs";
import AgendadosTabSection from "../components/afiliaciones/sections/AgendadosTabSection";
import AfiliacionesModals from "../components/afiliaciones/modals/AfiliacionesModals";
import MapaTabSection from "../components/afiliaciones/sections/MapaTabSection";
import PersonasTabSection from "../components/afiliaciones/sections/PersonasTabSection";
import useAfiliacionesController from "../hooks/afiliaciones/useAfiliacionesController";

export default function Afiliaciones() {
  const afi = useAfiliacionesController();

  return (
    <div className="afi-page">
      <AfiliacionesTabs tab={afi.tab} setTab={afi.setTab} />
      <PersonasTabSection afi={afi} />
      <MapaTabSection afi={afi} />
      <AgendadosTabSection afi={afi} />
      <AfiliacionesModals afi={afi} />
    </div>
  );
}
