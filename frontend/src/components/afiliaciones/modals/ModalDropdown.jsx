import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function ModalDropdown({
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
  const [maxH, setMaxH] = useState(240);

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

      const btn = root.querySelector(".afi-dd__btn");
      if (!btn) return;

      const btnRect = btn.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const menuH = Math.max(menu.scrollHeight, menuRect.height, 200);

      const viewportH = window.innerHeight;
      const spaceBelow = viewportH - btnRect.bottom - 16;
      const spaceAbove = btnRect.top - 16;

      const openUp = spaceBelow < Math.min(menuH, 280) && spaceAbove > spaceBelow;
      setDirection(openUp ? "up" : "down");

      const available = openUp ? spaceAbove : spaceBelow;
      const safe = Math.max(140, Math.min(available, 320));
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
    <div className="afi-modal-row" ref={rootRef}>
      <div className="afi-modal-label" style={{ whiteSpace: "pre-line" }}>
        {label}
      </div>

      <div className={`afi-dd ${isOpen ? "is-open" : ""} ${direction === "up" ? "is-up" : ""}`}>
        <button
          type="button"
          className="afi-dd__btn"
          onClick={() => setOpenDropdownId((prev) => (prev === id ? null : id))}
        >
          <span className="afi-dd__value">{value}</span>
          <span className="material-symbols-outlined afi-dd__chev">arrow_drop_down</span>
        </button>

        <div
          className="afi-dd__menu"
          ref={menuRef}
          style={{ maxHeight: `${maxH}px` }}
          aria-hidden={!isOpen}
        >
          {options.map((opt) => (
            <button
              type="button"
              key={opt}
              className={`afi-dd__item ${opt === value ? "is-selected" : ""}`}
              onClick={() => {
                onChange(opt);
                setOpenDropdownId(null);
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}