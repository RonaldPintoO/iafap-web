export const FICHA_MENOS_100 = 260;
export const FICHA_MAS_100 = 387;

export function onlyDigits(v) {
  return (v ?? "").replace(/\D+/g, "");
}

export function getRentStatusStyle(code) {
  switch (code) {
    case "Env":
      return {
        label: "Enviado",
        bg: "#f6c23e",
        color: "#222",
      };

    case "Con":
      return {
        label: "Confirmado",
        bg: "#28a745",
        color: "#fff",
      };

    case "Den":
      return {
        label: "Denegado",
        bg: "#d63b36",
        color: "#fff",
      };

    default:
      return {
        label: "",
        bg: "#ccc",
        color: "#000",
      };
  }
}

export function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const coarse =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(pointer: coarse)").matches;

  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || coarse;
}

export function isoToDDMMYYYY(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function ddmmyyyyToISO(v) {
  if (!v || !/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return "";
  const [dd, mm, yyyy] = v.split("/").map((x) => parseInt(x, 10));
  if (yyyy < 1900 || yyyy > 2100) return "";
  if (mm < 1 || mm > 12) return "";
  const days = new Date(yyyy, mm, 0).getDate();
  if (dd < 1 || dd > days) return "";
  const dd2 = String(dd).padStart(2, "0");
  const mm2 = String(mm).padStart(2, "0");
  return `${yyyy}-${mm2}-${dd2}`;
}

export function normalizePlate(raw) {
  return (raw ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function formatPlate(raw) {
  const v = normalizePlate(raw);
  const prefixLetters = (v.match(/^[A-Z]+/)?.[0] || "").slice(0, 3);
  if (!prefixLetters) return "";

  const rest = v.slice(prefixLetters.length);
  const digits = (rest.match(/\d/g) || []).join("").slice(0, 4);

  return digits ? `${prefixLetters} ${digits}` : prefixLetters;
}

export function normalizeTimeHHMM(v) {
  if (!v) return "";
  if (/^\d{2}:\d{2}$/.test(v)) return v;
  return v.slice(0, 5);
}

export function formatAdvanceAmountInput(v) {
  const digits = onlyDigits(v);
  if (!digits) return "";
  return parseInt(digits, 10).toLocaleString("es-UY");
}

export function parseAdvanceAmount(v) {
  const digits = onlyDigits(v);
  if (!digits) return 0;
  return parseInt(digits, 10);
}

export function calcAdvanceTokens(amount, tokenValue) {
  if (!amount || !tokenValue) return 0;
  return Math.floor(amount / tokenValue);
}