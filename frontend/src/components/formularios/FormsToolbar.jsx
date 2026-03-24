import ToolbarSelect from "./ToolbarSelect";
import { PERIODOS, ESTATUS } from "./forms.utils";

export default function FormsToolbar({
  periodo,
  setPeriodo,
  estatus,
  setEstatus,
  openDropdownId,
  setOpenDropdownId,
}) {
  return (
    <div className="forms-toolbar">
      <ToolbarSelect
        id="periodo"
        label="Período"
        value={periodo}
        options={PERIODOS}
        openDropdownId={openDropdownId}
        setOpenDropdownId={setOpenDropdownId}
        onChange={setPeriodo}
      />

      <ToolbarSelect
        id="estatus"
        label="Estatus"
        value={estatus}
        options={ESTATUS}
        openDropdownId={openDropdownId}
        setOpenDropdownId={setOpenDropdownId}
        onChange={setEstatus}
      />
    </div>
  );
}