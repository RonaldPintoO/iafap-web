import MapaPanel from "../mapa/MapaPanel";

export default function MapaTabSection({ afi }) {
  if (afi.tab !== "mapa") return null;

  return (
    <MapaPanel
      mapRef={afi.mapRef}
      userLoc={afi.userLoc}
      locStatus={afi.locStatus}
      locMsg={afi.locMsg}
      handleLocate={afi.handleLocate}
      mapPoints={afi.mapPoints}
      mapLoading={afi.mapLoading}
      mapError={afi.mapError}
      edadMinInput={afi.edadMinInput}
      edadMaxInput={afi.edadMaxInput}
      setEdadMinInput={afi.setEdadMinInput}
      setEdadMaxInput={afi.setEdadMaxInput}
      handleApplyEdadFiltro={afi.handleApplyEdadFiltro}
      handleClearEdadFiltro={afi.handleClearEdadFiltro}
      edadError={afi.edadError}
      tipoPersona={afi.tipoPersona}
      setTipoPersona={afi.setTipoPersona}
    />
  );
}
