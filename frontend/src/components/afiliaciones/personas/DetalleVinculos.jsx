import { useState } from "react";
import VinculoInfoModal from "./VinculoInfoModal";

function cleanValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function hasValue(value) {
  return cleanValue(value) !== "";
}

function normalizeText(value) {
  return cleanValue(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function getVinculoColorClass(vinculo) {
  const afap = normalizeText(vinculo?.situacionAfap);
  const actividad = normalizeText(vinculo?.actividad);

  if (afap === "INTEGRACION") {
    return "is-integracion";
  }

  if (afap === "OTRA AFAP") {
    return "is-otra-afap";
  }

  if (afap === "SIN AFAP" && actividad === "OK") {
    return "is-sin-afap-ok";
  }

  if (afap === "SIN AFAP" && actividad === "SIN ACTIVIDAD") {
    return "is-sin-afap-sin-actividad";
  }

  return "is-sin-afap-sin-actividad";
}

function VinculoCard({ vinculo, onInfo }) {
  const colorClass = getVinculoColorClass(vinculo);

  const nombre = [
    cleanValue(vinculo?.primerNombre),
    cleanValue(vinculo?.segundoNombre),
    cleanValue(vinculo?.primerApellido),
    cleanValue(vinculo?.segundoApellido),
  ]
    .filter(Boolean)
    .join(" ");

  const direccionTexto = [
    cleanValue(vinculo?.calle),
    cleanValue(vinculo?.numeroPuerta),
    cleanValue(vinculo?.apto),
  ]
    .filter(Boolean)
    .join(" ");

  const direccion = direccionTexto ? `Dir. ${direccionTexto}` : "Dir.";

  const lugar = [
    cleanValue(vinculo?.localidad),
    cleanValue(vinculo?.departamento),
  ]
    .filter(Boolean)
    .join(" ");

  const nacimiento = hasValue(vinculo?.nacimiento)
    ? new Date(vinculo.nacimiento).toLocaleDateString("es-UY")
    : "Sin dato";

  return (
    <article className="afi-vinculo-card">
      <div className={`afi-vinculo-card__title ${colorClass}`}>
        {cleanValue(vinculo?.tipoVinculo) || "VÍNCULO"}
      </div>

      <div className="afi-vinculo-card__body">
        <div className="afi-vinculo-card__content">
          <div className="afi-vinculo-card__name">{nombre || "Sin nombre"}</div>

          <div className="afi-vinculo-card__line">{direccion}</div>

          <div className="afi-vinculo-card__line">
            {lugar || "Sin localidad"}
          </div>

          <div className="afi-vinculo-card__line afi-vinculo-card__line--inline">
            <span>Ced.{cleanValue(vinculo?.cedula) || "Sin dato"}</span>
            <span>Nac.{nacimiento}</span>
          </div>

          <div className="afi-vinculo-card__line afi-vinculo-card__line--footer">
            <span>Tel.{cleanValue(vinculo?.telefono) || ""}</span>
            <span>Cel.{cleanValue(vinculo?.celular) || ""}</span>
            <strong>{cleanValue(vinculo?.situacionAfap) || "Sin dato"}</strong>
          </div>
        </div>

        <button
          type="button"
          className="afi-vinculo-card__info"
          aria-label="Ver vínculos relacionados"
          onClick={() => onInfo(vinculo)}
        >
          <span className="material-symbols-outlined">info</span>
        </button>
      </div>
    </article>
  );
}

export default function DetalleVinculos({
  vinculos = [],
  loading = false,
  error = "",
  onBuscarVinculosDePersona,
  vinculosInfoModal = [],
  vinculosInfoModalLoading = false,
  vinculosInfoModalError = "",
}) {
  const [vinculoSeleccionado, setVinculoSeleccionado] = useState(null);
  if (loading) {
    return (
      <div className="afi-detail-body">
        <div className="afi-empty">Cargando vínculos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="afi-detail-body">
        <div className="afi-empty">{error}</div>
      </div>
    );
  }
  if (!vinculos.length) {
    return (
      <div className="afi-detail-body">
        <div className="afi-empty">Sin vínculos para mostrar.</div>
      </div>
    );
  }

  return (
    <>
      <div className="afi-vinculos-body">
        {vinculos.map((vinculo, index) => (
          <VinculoCard
            key={`${vinculo?.cedula || "vinculo"}-${index}`}
            vinculo={vinculo}
            onInfo={(vinculo) => {
              setVinculoSeleccionado(vinculo);
              onBuscarVinculosDePersona?.(vinculo);
            }}
          />
        ))}
      </div>

      {vinculoSeleccionado && (
        <VinculoInfoModal
          vinculo={{
            datosDetalle: vinculoSeleccionado,
            vinculosDelVinculo: vinculosInfoModal,
          }}
          loading={vinculosInfoModalLoading}
          error={vinculosInfoModalError}
          onClose={() => setVinculoSeleccionado(null)}
        />
      )}
    </>
  );
}
