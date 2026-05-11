const buttonStyle = {
  border: "1px solid #e1e1e1",
  background: "#fff",
  borderRadius: 8,
  padding: "7px 10px",
  fontWeight: 700,
  color: "#b61c1c",
  cursor: "pointer",
};

const disabledButtonStyle = {
  ...buttonStyle,
  color: "#aaa",
  cursor: "not-allowed",
  background: "#f7f7f7",
};

export default function AnalysisPagination({
  page,
  pageSize = 20,
  totalItems = 0,
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems <= pageSize) {
    return null;
  }

  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      className="analysis-pagination"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "10px 4px 0",
        flexWrap: "wrap",
        color: "#777",
        fontSize: 12,
      }}
    >
      <div>
        Mostrando <strong>{from}</strong> a <strong>{to}</strong> de{" "}
        <strong>{totalItems}</strong>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          type="button"
          style={currentPage <= 1 ? disabledButtonStyle : buttonStyle}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Anterior
        </button>

        <span style={{ fontWeight: 700 }}>
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          style={currentPage >= totalPages ? disabledButtonStyle : buttonStyle}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
