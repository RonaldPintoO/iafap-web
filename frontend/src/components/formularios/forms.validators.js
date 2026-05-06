import { cleanText, cleanNumbers, getEdadDesdeFecha, normalizeText } from "./forms.utils";

export function validateFormularioPayload(datos) {
  const errors = [];
  const warnings = [];

  if (!cleanText(datos.formulario)) errors.push("Debe ingresar el número de formulario.");
  if (!cleanText(datos.fechaForm)) errors.push("Seleccione la fecha de formulario.");
  if (!cleanText(datos.tipoDocumento)) errors.push("Seleccione el tipo de documento.");
  if (!cleanText(datos.cedula)) errors.push("Debe ingresar el documento.");

  const documentoSoloNumeros = cleanNumbers(datos.cedula);
  if (cleanText(datos.cedula) && documentoSoloNumeros !== cleanText(datos.cedula)) {
    errors.push("El documento debe ser numérico. Para pasaporte o documento extranjero, ingrese la CI ficticia asignada, por ejemplo 100000000.");
  }
  if (!cleanText(datos.fechaNac)) errors.push("Seleccione la fecha de nacimiento.");
  if (!cleanText(datos.celular) && !cleanText(datos.telefono)) {
    errors.push("Debe ingresar al menos teléfono o celular.");
  }
  if (!cleanText(datos.calle)) errors.push("Debe ingresar la calle.");
  if (!cleanText(datos.nro)) errors.push("Debe ingresar el número de puerta.");
  if (!cleanText(datos.departamento)) errors.push("Seleccione departamento.");
  if (!cleanText(datos.localidad)) errors.push("Seleccione localidad.");
  if (!cleanText(datos.pais)) errors.push("Seleccione país.");
  if (!cleanText(datos.proyecto)) errors.push("Seleccione proyecto.");
  if (!cleanText(datos.distancia)) errors.push("Seleccione distancia.");

  if (cleanText(datos.mail) && !/^\S+@\S+\.\S+$/.test(cleanText(datos.mail))) {
    errors.push("El mail ingresado no tiene un formato válido.");
  }

  if (documentoSoloNumeros && documentoSoloNumeros.length < 6) {
    errors.push("El documento debe tener al menos 6 números.");
  }

  if (!datos.fotoFormulario) {
    errors.push("Debe tomar o cargar foto del formulario.");
  }

  if (!datos.fotoCiFrente && !datos.fotoCiDorso) {
    warnings.push("No ha cargado foto del documento. ¿Desea enviar de todas formas?");
  }

  const edad = getEdadDesdeFecha(datos.fechaNac);
  if (edad !== null && edad > 35) {
    if (!datos.foto35Frente) {
      warnings.push("La persona tiene más de 35 años. Falta foto del formulario 35 frente. ¿Desea enviar de todas formas?");
    }
    if (!datos.foto35Dorso) {
      warnings.push("La persona tiene más de 35 años. Falta foto del formulario 35 dorso. ¿Desea enviar de todas formas?");
    }
  }

  return { errors, warnings };
}
