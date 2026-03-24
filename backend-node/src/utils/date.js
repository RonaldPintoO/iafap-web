function formatFechaISO(value) {
  if (!value) return null;

  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch (error) {
    return null;
  }
}

function formatFechaDDMMYYYY(value) {
  if (!value) return "";

  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
  } catch (error) {
    return "";
  }
}

module.exports = {
  formatFechaISO,
  formatFechaDDMMYYYY,
};