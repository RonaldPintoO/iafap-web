import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function ToolbarSelect({
  id,
  label,
  value,
  options,
  openDropdownId,
  setOpenDropdownId,
  onChange,
}) {
  const isOpen = openDropdownId === id;
  const rootRef = useRef(null);
  const menuRef = useRef(null);

  const [direction, setDirection] = useState("down");
  const [maxH, setMaxH] = useState(340);
  const [btnRect, setBtnRect] = useState(null);

  useEffect(() => {
    if (!isOpen) return;

    const onDocDown = (e) => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target)) setOpenDropdownId(null);
    };

    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("touchstart", onDocDown);

    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("touchstart", onDocDown);
    };
  }, [isOpen, setOpenDropdownId]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const calc = () => {
      const root = rootRef.current;
      const menu = menuRef.current;
      if (!root || !menu) return;

      const rect = root.getBoundingClientRect();
      setBtnRect(rect);

      const menuH = Math.max(menu.scrollHeight, 220);
      const viewportH = window.innerHeight;
      const spaceBelow = viewportH - rect.bottom - 16;
      const spaceAbove = rect.top - 16;

      const openUp = spaceBelow < Math.min(menuH, 280) && spaceAbove > spaceBelow;
      setDirection(openUp ? "up" : "down");

      const available = openUp ? spaceAbove : spaceBelow;
      const safe = Math.max(160, Math.min(available, 520));
      setMaxH(safe);
    };

    calc();
    window.addEventListener("resize", calc);
    window.addEventListener("scroll", calc, true);

    return () => {
      window.removeEventListener("resize", calc);
      window.removeEventListener("scroll", calc, true);
    };
  }, [isOpen]);

  return (
    <div className="forms-select-wrap" ref={rootRef}>
      <button
        type="button"
        className="forms-select"
        onClick={() => setOpenDropdownId((prev) => (prev === id ? null : id))}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="forms-select__label">{label}</div>
        <div className="forms-select__value">{value}</div>
        <span className="material-symbols-outlined forms-select__chev">
          arrow_drop_down
        </span>
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          role="listbox"
          className="forms-select-menu"
          style={{
            position: "fixed",
            left: btnRect ? Math.max(16, btnRect.left) : 16,
            right: 16,
            top: btnRect ? (direction === "down" ? btnRect.bottom + 6 : "auto") : "auto",
            bottom:
              btnRect && direction === "up"
                ? window.innerHeight - btnRect.top + 6
                : "auto",
            maxHeight: `${maxH}px`,
          }}
        >
          {options.map((opt) => (
            <button
              type="button"
              key={opt}
              className={`forms-select-item ${opt === value ? "is-selected" : ""}`}
              onClick={() => {
                onChange(opt);
                setOpenDropdownId(null);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}