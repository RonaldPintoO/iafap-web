const soap = require("soap");
const env = require("../config/env");

function cleanValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

async function obtenerContactos({ personas }) {
  if (!Array.isArray(personas) || personas.length === 0) {
    const error = new Error("Debe enviarse al menos una persona");
    error.statusCode = 400;
    throw error;
  }

  if (!env.BPS_SOAP_USER) {
    const error = new Error("Falta configurar BPS_SOAP_USER");
    error.statusCode = 500;
    throw error;
  }

  if (!env.BPS_SOAP_PASSWORD) {
    const error = new Error("Falta configurar BPS_SOAP_PASSWORD");
    error.statusCode = 500;
    throw error;
  }

  const client = await soap.createClientAsync(env.BPS_SOAP_WSDL, {
    endpoint: env.BPS_SOAP_URL,
  });

  client.setSecurity(
    new soap.WSSecurity(env.BPS_SOAP_USER, env.BPS_SOAP_PASSWORD, {
      passwordType: "PasswordText",
      hasTimeStamp: false,
    }),
  );

  const args = {
    ParamObtenerContactos: {
      personasLista: {
        itemPersona: personas.map((p) => ({
          nroDocumento: cleanValue(p.nroDocumento),
          paisDocumento: cleanValue(p.paisDocumento),
          tipoDocumento: cleanValue(p.tipoDocumento),
        })),
      },
      usuario: env.BPS_SOAP_USER,
    },
  };

  const [response] = await client.obtenerContactosAsync(args);

  const result = response?.ResultObtenerContactos || response;

  const primerContacto = result?.contactosLista?.itemContacto?.[0] || null;

  const telefonoLista = primerContacto?.telefonoLista?.itemTelefono;

  const telefonos = asArray(telefonoLista)
    .map((x) => cleanValue(x))
    .filter(Boolean);

  // 👇 ACA LEEMOS DIRECTO DESDE RAW
  const domicilioRaw =
    result?.contactosLista?.itemContacto?.[0]?.domicilioLista?.itemDomicilio;

  let primerDomicilio = null;

  if (Array.isArray(domicilioRaw)) {
    primerDomicilio = domicilioRaw[0] || null;
  } else if (domicilioRaw && typeof domicilioRaw === "object") {
    primerDomicilio = domicilioRaw;
  }

  // 👇 ARMAMOS DIRECCION
  const direccion = primerDomicilio
    ? {
        departamento: cleanValue(primerDomicilio.departamento),
        localidad: cleanValue(primerDomicilio.localidad),
        calle: cleanValue(primerDomicilio.nomCalle),
        numero: cleanValue(primerDomicilio.nroPuerta),
        apto: cleanValue(primerDomicilio.apto),
      }
    : null;

  return {
    telefono: telefonos[0] || "",
    telefonos,
    direccion,
    raw: response,
  };
}

module.exports = {
  obtenerContactos,
};
