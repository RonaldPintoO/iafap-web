export const ROWS = 5;

export function onlyDigits(value) {
  return value.replace(/\D/g, "");
}

export function createEmptyRows(count = ROWS) {
  return Array.from({ length: count }, () => ({ cedula: "", fecha: "" }));
}

export function isCedulaValid(value) {
  return value === "" || (value.length >= 7 && value.length <= 8);
}

export function isFechaValid(value) {
  return value === "" || value.length === 8;
}

export function hasAtLeastOneFilledRow(rows) {
  return rows.some((r) => r.cedula || r.fecha);
}

export function canSubmitRows(rows) {
  return rows.every((r) => isCedulaValid(r.cedula) && isFechaValid(r.fecha));
}