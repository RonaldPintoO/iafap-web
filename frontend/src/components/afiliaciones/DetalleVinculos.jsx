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

const MOCK_VINCULOS = [
  {
    tipoVinculo: "HERMANO/HERMANA",
    nombre: "CAMILA DIAZ",
    direccion: "",
    localidad: "MONTEVIDEO",
    departamento: "",
    cedula: "62257148",
    nacimiento: "13/09/2016",
    telefono: "40000000",
    celular: "",
    situacionAfap: "Sin Afap",
    actividad: "Sin Actividad",

    datosDetalle: {
      primerApellido: "DIAZ",
      segundoApellido: "",
      primerNombre: "CAMILA",
      segundoNombre: "",
      fechaNacimiento: "13/09/2016",
      ciudad: "MONTEVIDEO",
      localidad: "MONTEVIDEO",
      telefono: "40000000",
    },

    vinculosDelVinculo: [
      {
        tipo: "MENOR SUJETO A CARGO",
        nombre: "DIAZ, MARIA",
        fecha: "15/03/2017",
        cedula: "48263838",
      },
      {
        tipo: "HIJO/HIJA PRENATAL",
        nombre: "DIAZ, MARIA",
        fecha: "25/04/2005",
        cedula: "48263838",
      },
      {
        tipo: "HIJO/HIJA NATURAL RECONOCIDO O LEGITIMO",
        nombre: "DIAZ, MARIA",
        fecha: "29/12/2005",
        cedula: "48263838",
      },
    ],
  },
  {
    tipoVinculo: "HERMANO/HERMANA",
    nombre: "DIEGO DIAZ",
    direccion: "",
    localidad: "MONTEVIDEO",
    departamento: "",
    cedula: "62257154",
    nacimiento: "13/09/2016",
    telefono: "40000000",
    celular: "",
    situacionAfap: "Sin Afap",
    actividad: "Sin Actividad",

    datosDetalle: {
      primerApellido: "DIAZ",
      segundoApellido: "",
      primerNombre: "DIEGO",
      segundoNombre: "",
      fechaNacimiento: "13/09/2016",
      ciudad: "MONTEVIDEO",
      localidad: "MONTEVIDEO",
      telefono: "40000000",
    },

    vinculosDelVinculo: [
      {
        tipo: "MENOR SUJETO A CARGO",
        nombre: "DIAZ, ANA",
        fecha: "11/05/2017",
        cedula: "48263839",
      },
      {
        tipo: "HIJO/HIJA NATURAL RECONOCIDO O LEGITIMO",
        nombre: "DIAZ, ANA",
        fecha: "13/09/2016",
        cedula: "48263839",
      },
    ],
  },
  {
    tipoVinculo: "HERMANO/HERMANA",
    nombre: "CATERIN DIAZ",
    direccion: "0",
    localidad: "FLORIDA",
    departamento: "FLORIDA",
    cedula: "57407796",
    nacimiento: "25/04/2008",
    telefono: "40000000",
    celular: "",
    situacionAfap: "Sin Afap",
    actividad: "Sin Actividad",

    datosDetalle: {
      primerApellido: "DIAZ",
      segundoApellido: "",
      primerNombre: "CATERIN",
      segundoNombre: "",
      fechaNacimiento: "25/04/2008",
      ciudad: "FLORIDA",
      localidad: "FLORIDA",
      telefono: "40000000",
    },

    vinculosDelVinculo: [
      {
        tipo: "SUJETO A TENENCIA",
        nombre: "DIAZ, MARIA",
        fecha: "20/06/2018",
        cedula: "48263840",
      },
    ],
  },
  {
    tipoVinculo: "OTROS VINCULOS",
    nombre: "KAREN FIGUEROA",
    direccion: "VIV. MEVIR 13343",
    localidad: "LA PALOMA",
    departamento: "DURAZNO",
    cedula: "49028457",
    nacimiento: "05/07/1993",
    telefono: "96932267",
    celular: "",
    situacionAfap: "Sin Afap",
    actividad: "OK",

    datosDetalle: {
      primerApellido: "FIGUEROA",
      segundoApellido: "",
      primerNombre: "KAREN",
      segundoNombre: "",
      fechaNacimiento: "05/07/1993",
      ciudad: "LA PALOMA",
      localidad: "DURAZNO",
      telefono: "96932267",
    },

    vinculosDelVinculo: [
      {
        tipo: "HIJO/HIJA NATURAL RECONOCIDO O LEGITIMO",
        nombre: "FIGUEROA, LUCAS",
        fecha: "12/08/2014",
        cedula: "51234567",
      },
      {
        tipo: "MENOR SUJETO A CARGO",
        nombre: "FIGUEROA, LUCAS",
        fecha: "01/02/2016",
        cedula: "51234567",
      },
    ],
  },
  {
    tipoVinculo: "OTROS VINCULOS",
    nombre: "GRACIELA DIAZ",
    direccion: "RIVERA INDARTE 4443",
    localidad: "MONTEVIDEO",
    departamento: "MONTEVIDEO",
    cedula: "49028413",
    nacimiento: "17/02/1987",
    telefono: "20000000",
    celular: "093567895",
    situacionAfap: "Integración",
    actividad: "OK",

    datosDetalle: {
      primerApellido: "DIAZ",
      segundoApellido: "",
      primerNombre: "GRACIELA",
      segundoNombre: "",
      fechaNacimiento: "17/02/1987",
      ciudad: "MONTEVIDEO",
      localidad: "MONTEVIDEO",
      telefono: "20000000",
    },

    vinculosDelVinculo: [
      {
        tipo: "MENOR SUJETO A CARGO",
        nombre: "DIAZ, SOFIA",
        fecha: "03/09/2015",
        cedula: "52345678",
      },
    ],
  },
  {
    tipoVinculo: "PADRE/MADRE",
    nombre: "YANELA RODRIGUEZ",
    direccion: "PARAJE COLONIA 33 ORIENTALES",
    localidad: "FLORIDA",
    departamento: "FLORIDA",
    cedula: "43743081",
    nacimiento: "13/06/1986",
    telefono: "40000000",
    celular: "091907301",
    situacionAfap: "Otra Afap",
    actividad: "OK",

    datosDetalle: {
      primerApellido: "RODRIGUEZ",
      segundoApellido: "",
      primerNombre: "YANELA",
      segundoNombre: "",
      fechaNacimiento: "13/06/1986",
      ciudad: "FLORIDA",
      localidad: "FLORIDA",
      telefono: "40000000",
    },

    vinculosDelVinculo: [
      {
        tipo: "HIJO/HIJA NATURAL RECONOCIDO O LEGITIMO",
        nombre: "RODRIGUEZ, ANA",
        fecha: "17/07/2005",
        cedula: "55449471",
      },
      {
        tipo: "SUJETO A TENENCIA",
        nombre: "RODRIGUEZ, ANA",
        fecha: "20/03/2017",
        cedula: "55449471",
      },
    ],
  },
  {
    tipoVinculo: "OTROS VINCULOS",
    nombre: "DIEGO DIAZ",
    direccion: "BARRIO UTE",
    localidad: "LA PALOMA",
    departamento: "DURAZNO",
    cedula: "46808818",
    nacimiento: "16/03/1983",
    telefono: "91054948",
    celular: "",
    situacionAfap: "Otra Afap",
    actividad: "OK",

    datosDetalle: {
      primerApellido: "DIAZ",
      segundoApellido: "",
      primerNombre: "DIEGO",
      segundoNombre: "",
      fechaNacimiento: "16/03/1983",
      ciudad: "LA PALOMA",
      localidad: "DURAZNO",
      telefono: "91054948",
    },

    vinculosDelVinculo: [],
  },
  {
    tipoVinculo: "OTROS VINCULOS",
    nombre: "MARIA DIAZ",
    direccion: "MEVIR I 1185",
    localidad: "PIEDRAS COLORADAS",
    departamento: "PAYSANDU",
    cedula: "45079139",
    nacimiento: "16/06/1978",
    telefono: "20000000",
    celular: "099441768",
    situacionAfap: "Sin Afap",
    actividad: "Sin Actividad",

    datosDetalle: {
      primerApellido: "DIAZ",
      segundoApellido: "",
      primerNombre: "MARIA",
      segundoNombre: "",
      fechaNacimiento: "16/06/1978",
      ciudad: "PIEDRAS COLORADAS",
      localidad: "PAYSANDU",
      telefono: "20000000",
    },

    vinculosDelVinculo: [
      {
        tipo: "MENOR SUJETO A CARGO",
        nombre: "DIAZ, MARTIN",
        fecha: "10/10/2010",
        cedula: "53456789",
      },
    ],
  },
  {
    tipoVinculo: "PADRE/MADRE",
    nombre: "EDUARDO DIAZ",
    direccion: "",
    localidad: "FLORIDA",
    departamento: "FLORIDA",
    cedula: "45079123",
    nacimiento: "08/07/1975",
    telefono: "40000000",
    celular: "099014250",
    situacionAfap: "Otra Afap",
    actividad: "OK",

    datosDetalle: {
      primerApellido: "DIAZ",
      segundoApellido: "",
      primerNombre: "EDUARDO",
      segundoNombre: "",
      fechaNacimiento: "08/07/1975",
      ciudad: "FLORIDA",
      localidad: "FLORIDA",
      telefono: "40000000",
    },

    vinculosDelVinculo: [
      {
        tipo: "HIJO/HIJA NATURAL RECONOCIDO O LEGITIMO",
        nombre: "DIAZ, ANA",
        fecha: "17/07/2005",
        cedula: "55449471",
      },
    ],
  },
];

function VinculoCard({ vinculo, onInfo }) {
  const colorClass = getVinculoColorClass(vinculo);

  const direccion = hasValue(vinculo?.direccion)
    ? `Dir. ${cleanValue(vinculo.direccion)}`
    : "Dir.";

  const lugar = [
    cleanValue(vinculo?.localidad),
    cleanValue(vinculo?.departamento),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className="afi-vinculo-card">
      <div className={`afi-vinculo-card__title ${colorClass}`}>
        {cleanValue(vinculo?.tipoVinculo) || "VÍNCULO"}
      </div>

      <div className="afi-vinculo-card__body">
        <div className="afi-vinculo-card__content">
          <div className="afi-vinculo-card__name">
            {cleanValue(vinculo?.nombre) || "Sin nombre"}
          </div>

          <div className="afi-vinculo-card__line">{direccion}</div>

          <div className="afi-vinculo-card__line">
            {lugar || "Sin localidad"}
          </div>

          <div className="afi-vinculo-card__line afi-vinculo-card__line--inline">
            <span>Ced.{cleanValue(vinculo?.cedula) || "Sin dato"}</span>
            <span>Nac.{cleanValue(vinculo?.nacimiento) || "Sin dato"}</span>
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

export default function DetalleVinculos({ vinculos = MOCK_VINCULOS }) {
  const [vinculoSeleccionado, setVinculoSeleccionado] = useState(null);

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
            onInfo={setVinculoSeleccionado}
          />
        ))}
      </div>

      <VinculoInfoModal
        vinculo={vinculoSeleccionado}
        onClose={() => setVinculoSeleccionado(null)}
      />
    </>
  );
}