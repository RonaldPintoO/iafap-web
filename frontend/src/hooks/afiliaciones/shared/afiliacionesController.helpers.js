import { getAuthSession } from "../../../components/auth/auth.storage";
import { getConfiguracionGuardada } from "../../../components/configuracion/configuracion.utils";

export function scrollAppToTop() {
  window.requestAnimationFrame(() => {
    const main = document.querySelector(".main");
    if (main && typeof main.scrollTo === "function") {
      main.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    const detail = document.querySelector(".afi-detail");
    if (detail && typeof detail.scrollTo === "function") {
      detail.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  });
}

export function getAsesorLogueado() {
  const session = getAuthSession();
  return session?.user?.asenum ? String(session.user.asenum) : "";
}

export function getAsesorConfigurado() {
  const saved = getConfiguracionGuardada();
  return saved?.asesorCodigo ? String(saved.asesorCodigo).trim() : "";
}

export function getAsesorActivo() {
  return getAsesorLogueado() || getAsesorConfigurado();
}

export function buildPersonaDesdeAgendado(item) {
  return {
    ...item,
    cedula: item?.documento,
    fechaNac: item?.fechaNacimiento,
    ciudad: item?.localidad,
    nroPuerta: item?.nroPuerta,
    paisExtranjero: item?.paisExtranjero,
    tieneDocumentoExtranjero: item?.esExtranjero,
  };
}
