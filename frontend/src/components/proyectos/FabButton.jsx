export default function FabButton({ onClick, label = "Agregar", icon = "add" }) {
  return (
    <button
      type="button"
      className="proj-fab"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  );
}