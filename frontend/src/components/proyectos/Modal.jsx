export default function Modal({ title, children, actions = [], onClose }) {
  return (
    <div className="proj-modal-backdrop" onClick={onClose}>
      <div className="proj-modal" onClick={(e) => e.stopPropagation()}>
        <div className="proj-modal__title">{title}</div>

        <div className="proj-modal__body">
          {typeof children === "string" ? (
            <div className="proj-modal__msg">{children}</div>
          ) : (
            children
          )}
        </div>

        <div className="proj-modal__actions">
          {actions.map((a) => (
            <button
              key={a.label}
              type="button"
              className="proj-modal__action"
              onClick={a.onClick}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}