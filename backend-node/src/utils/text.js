function cleanText(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function toTitleCase(value) {
  const text = cleanText(value);
  if (!text) return "";

  return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

module.exports = {
  cleanText,
  toTitleCase,
};